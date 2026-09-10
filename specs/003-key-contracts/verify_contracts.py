"""Check documentation fixtures, not the future Common implementation."""
import json
import re
import struct
from decimal import Decimal
from pathlib import Path

ROOT = Path(__file__).resolve().parent


def frame(raw):
    if len(raw) < 8:
        return None
    version, source, target, size = struct.unpack('>HHHH', raw[:8])
    assert version == 1 and 1 <= size <= 1024
    assert (source, target) in ((1, 16), (16, 1))
    if len(raw) < 8 + size:
        return None
    return raw[8:8 + size], raw[8 + size:]


def tlvs(raw):
    result = []
    while raw:
        assert len(raw) >= 2
        tag, size = raw[:2]
        offset = 2
        if size & 128:
            count = size & 127
            assert 1 <= count <= 2 and len(raw) >= 2 + count
            size = int.from_bytes(raw[2:2 + count], 'big')
            assert size >= 128 and (count == 1 or size > 255)
            offset += count
        assert len(raw) >= offset + size
        value = raw[offset:offset + size]
        if tag == 2:
            assert value
            assert len(value) == 1 or not (value[0] == 0 and value[1] < 128)
        if tag & 32:
            tlvs(value)
        result.append((tag, value))
        raw = raw[offset + size:]
    return result


def main():
    fixtures = json.loads((ROOT / 'vectors.json').read_text(encoding='utf-8'))
    apdus = {}
    for item in fixtures:
        raw = bytes.fromhex(item['hex'])
        parsed = frame(raw)
        assert parsed and not parsed[1], item['name']
        assert int.from_bytes(raw[2:4], 'big') == (1 if item['direction'] == 'meter' else 16)
        apdu = parsed[0]
        apdus[item['name']] = apdu
        if apdu[0] in (0x30, 0x60, 0x61):
            assert len(tlvs(apdu)) == 1
        for cut in range(len(raw)):
            assert frame(raw[:cut]) is None
        assert frame(raw + raw)[1] == raw
    login = tlvs(tlvs(apdus['login'])[0][1])
    assert [x[0] for x in login] == [2, 4, 4, 4, 4]
    assert [x[1] for x in login] == [b'\x01', b'M1', b'S1', b'T1', b'2026-09-10T00:00:00Z']
    assert tlvs(tlvs(apdus['login_ok'])[0][1])[0][1] == b'\x00\x81'
    fail = dict(tlvs(tlvs(apdus['aare_bad_password'])[0][1]))
    assert fail[0xA2] == bytes.fromhex('020101') and fail[0xA3].endswith(b'\x0d')
    get = apdus['get_voltage']
    assert get[:3] == bytes.fromhex('C001C1') and len(get) == 13
    assert int.from_bytes(get[3:5], 'big') == 3
    assert '.'.join(str(n) for n in get[5:11]) == '1.1.32.7.0.255'
    assert get[11:] == b'\x02\x00'
    voltage = apdus['get_voltage_ok']
    assert voltage[:5] == bytes.fromhex('C401C10006')
    assert int.from_bytes(voltage[5:], 'big') == 2300
    assert Decimal(2300) * Decimal('0.1') == Decimal('230.0')
    assert apdus['get_denied'] == bytes.fromhex('C401C10103')
    assert int.from_bytes(apdus['get_long'][5:], 'big', signed=True) == 100
    assert apdus['get_octets'][4:] == b'\x09\x02OK'
    for raw in (bytes.fromhex('0002000100100001FF'), bytes.fromhex('0001000100100401')):
        try:
            frame(raw)
        except AssertionError:
            pass
        else:
            raise AssertionError('invalid header accepted')
    samples = []
    for block in re.findall(r'```json\s*(.*?)```', (ROOT / 'http-mq.md').read_text(encoding='utf-8'), re.S):
        samples.append(json.loads(block))
    start, accepted, query, result, request, response = samples
    assert accepted['data']['taskId'] == query['taskId'] == result['data']['taskId'] == request['payload']['taskId']
    assert start['meterIds'] == [request['payload']['meters'][0]['meterId']]
    assert start['dataItemIds'] == [request['payload']['dataItems'][0]['dataItemId']]
    assert request['messageId'] == response['payload']['requestMessageId']
    for key in ('taskId', 'meterTaskId', 'attemptId', 'invokeId'):
        assert request['payload'][key] == response['payload'][key]
    assert request['payload']['dlmsMessage'] == get.hex().upper()
    assert response['payload']['dlmsMessage'] == voltage.hex().upper()
    assert 'authPassword' not in json.dumps(response) + json.dumps(result)
    snapshot = result['data']
    assert snapshot['total'] == snapshot['completed'] == snapshot['succeeded'] + snapshot['failed'] == len(snapshot['list'])
    checked = 0
    for path in list(ROOT.glob('*.md')) + list(ROOT.parent.glob('*.md')) + [ROOT.parents[1] / 'docs' / '12-implementationStep.md']:
        for link in re.findall(r'\[[^\]]*\]\(([^)]+)\)', path.read_text(encoding='utf-8')):
            if '://' in link or link.startswith('#'):
                continue
            assert (path.parent / link.split('#')[0]).exists(), (path, link)
            checked += 1
    print(f'PASS: {len(fixtures)} frames; all split points/coalescing; invalid headers; BER; GET/scaling; {len(samples)} JSON examples; correlation; password boundary; {checked} local links')


if __name__ == '__main__':
    main()
