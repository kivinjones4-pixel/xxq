# Protocol v1 字节合同

来源：00 §5.2 P1–P7，06 §3，07 §3–5，08 §4。优先遵守任务书的标准方向；07 的 1 字节版本/缺少端口头和“所有 APDU 都是 BER”不作为实现布局。

核对参考（2026-09-10）：[Gurux Wrapper 实现 getWrapperFrame](https://raw.githubusercontent.com/Gurux/Gurux.DLMS.Python/master/Gurux.DLMS.python/gurux_dlms/GXDLMS.py)、[ACSE/Initiate 实现](https://raw.githubusercontent.com/Gurux/Gurux.DLMS.Python/master/Gurux.DLMS.python/gurux_dlms/_GXAPDU.py)、[数据编码参考](https://raw.githubusercontent.com/Gurux/Gurux.DLMS.Python/master/Gurux.DLMS.python/gurux_dlms/internal/_GXCommon.py)。这些是实现方的一手参考，未导入其代码，也不代表已获得 IEC 全文或标准认证。以下固定取值、限制和登录扩展为项目设计。

## 传输头

全部多字节整数大端；无额外 CRC、结束符或 HDLC/LLC 字节。

| 偏移 | 字节数 | 字段 |
| --- | --- | --- |
| 0 | 2 | version=0001 |
| 2 | 2 | source wPort |
| 4 | 2 | destination wPort |
| 6 | 2 | APDU 字节长度 N（不含头） |
| 8 | N | APDU |

Channels 是 TCP 服务端，但 DLMS 客户端 wPort=16；模拟表是 TCP 客户端，但 DLMS 服务端 wPort=1。Channels→表为 `0010 0001`，表→Channels 为 `0001 0010`，登录扩展也按此方向。wPort 不是 TCP 端口，也不是 meterAddress。

本项目 N=1..1024。先收齐 8 字节、校验版本/方向/长度，再等待 N 字节；同缓冲区多帧逐一消费。非法头或 APDU 关闭会话；半包最多等待 5 秒（从该帧首字节收到起，不随碎片续期），单连接未处理缓冲上限 64 KiB。关闭关联尝试为 PROTOCOL_ERROR；EOF 半包为 DISCONNECTED。禁止按不可信长度无界分配。

## 登录/心跳：项目 BER 扩展

APDU 为 `30 length fields`，字段按表顺序出现，不能省略、重排或附加字段。BER 使用确定长度的最短编码；长度 <128 单字节，128..255 为 81 xx，256..1024 为 82 xxxx；拒绝不定长。INTEGER 使用最短有符号二补码，正数最高位为 1 时前补 00，因此 0x81 编为 `02 02 00 81`。OCTET STRING tag=04。

| APDU | 顺序字段 |
| --- | --- |
| LOGIN | INTEGER 1，OCTET meterAddress，OCTET serialNumber，OCTET meterType，OCTET timestamp |
| LOGIN_RESPONSE | INTEGER 129，INTEGER result，OCTET timestamp |
| HEARTBEAT | INTEGER 2，OCTET meterAddress，OCTET timestamp |
| HEARTBEAT_RESPONSE | INTEGER 130，INTEGER result，OCTET timestamp |

字符串 UTF-8；地址 1..50 ASCII 字符 `[A-Za-z0-9-]`，serialNumber 1..50 UTF-8 字节，meterType 1..20 UTF-8 字节；timestamp 固定 20 个 ASCII 字节 `YYYY-MM-DDTHH:mm:ssZ`，UTC。模拟表 serialNumber 使用实例配置，缺省等于 meterAddress（数据库不新增必需列）。按 00 要求全部登录字段必填，不接收 07 的缺字段变体。result：0 成功、1 字段无效、2 地址已在线、3 未登录或地址不匹配；能解析的无效请求返回对应失败后断开，不能可靠解码则直接断开。

连接 5 秒内必须登录；重复地址拒绝新连接，保留原连接。未登录不能发送心跳或处理 GET。登录成功用服务端单调时钟初始化 lastHeartbeat；只有同连接同地址合法心跳更新它。每 180 秒发心跳；每秒检查一次，elapsed >540 秒断开，恰好 540 秒不离线。GET 流量不代替心跳。清理必须比较 connectionId，旧连接回调不得删除新映射；status 档案字段保持启用含义。

断连清除认证状态。模拟表重连间隔 1、2、4、8、16、30 秒，随后每 30 秒重试，无次数上限；登录成功重置退避。正常退出不重连。以上时限为设计补充。

## ACSE BER 与 LLS

LN、无加密上下文 OID `2.16.756.5.8.1.1`，编码 `A1 09 06 07 60 85 74 05 08 01 01`。ACSE protocol-version 采用默认值并省略；calling/called AP title 为本无加密子集可选且不发送，区别于 07 的概念字段列表。LLS mechanism OID `2.16.756.5.8.2.1`。

AARQ 外层 60 + BER 长度，依次：上述 A1；sender requirements `8A 02 07 80`；mechanism `8B 07 60 85 74 05 08 02 01`；authentication `AC (L+2) 80 L passwordBytes`；user-information `BE 10 04 0E 01 00 00 00 06 5F 1F 04 00 00 00 10 04 00`。密码为档案原值 UTF-8，1..50 字节，不 trim、不输出日志；这里只允许测试夹具密码。xDLMS version=6、仅 GET conformance=000010、最大接收 PDU=1024。

AARE 外层 61，依次 A1、result `A2 03 02 01 R`、diagnostic `A3 05 A1 03 02 01 D`。成功 R=0/D=0，追加 `BE 10 04 0E 08 00 06 5F 1F 04 00 00 00 10 04 00 00 07`（LN VAA=0007）；错误密码 R=1/D=13，不带 user-information。上下文不支持 R=1/D=2。成功响应必须验证上下文、版本、GET 能力与 PDU 范围，否则不进入认证态。

Channels 在当前会话未认证时先发 AARQ；认证失败不发 GET。同连接、相同密码快照可复用认证；密码变化关闭旧连接，等待重新登录后再认证。AARQ 超时关闭连接。密码只允许进入内部 ReadTask 和认证报文，不进入结果、状态消息、可查询日志或导出。

## GET：xDLMS A-XDR，非通用 BER

GET-request-normal：`C0 01 I classId(2) obis(6) attributeId(1) 00`。classId=1..65535、attributeId=1..127；六个 OBIS 分量各 0..255；尾 00 表示无选择性访问。I=0xC0 | invokeId，invokeId 为 1..15；高优先级、confirmed。响应必须原样回显 I。

GET-response-normal：`C4 01 I 00 Data`（成功）或 `C4 01 I 01 E`（失败）。E：3 read-write-denied，4 object-undefined，9 object-class-inconsistent，12 type-unmatched，250 other-reason；其余非零访问错误也映射 DATA_ACCESS_ERROR，保留数值。响应类型非 normal 映射 UNSUPPORTED_APDU。

| 字典 dataType | Data 布局 | 值范围/展示 |
| --- | --- | --- |
| long | 10 + 2 字节有符号整数 | -32768..32767 |
| double-long-unsigned | 06 + 4 字节无符号整数 | 0..4294967295 |
| octet-string | 09 + A-XDR 长度 + 原始字节 | 0..255 字节；原值大写 hex |

A-XDR 字符串长度 <128 单字节，否则 81 xx；不要当 BER tag/length/value 解整数。数值以十进制字符串返回 rawValue 和 value，value=rawValue×10^scaler，使用十进制定点计算，unit 来自字典。类型与字典不符为 DATA_TYPE_MISMATCH。时钟/需量时间 octet-string 使用 COSEM 12 字节日期时间；日期用 5 字节，状态字/序列号保留 hex，不隐式将任意字节转日期。

时间格式补充：日期时间为 year(2)、month、day、dayOfWeek(1=周一)、hour、minute、second、hundredths、deviation(2，有符号，UTC 使用 0)、status(0)；日期为前 5 字节。模拟表只生成确定 UTC 时间，不生成通配符。未知类型、分块、选择性访问明确失败。

响应关联由 connectionId+invokeId 和当前尝试共同约束。一个连接最多使用 15 个 GET invokeId，每个只用一次；耗尽后关闭并重新登录/认证，防止旧包在回绕后匹配新请求。任何尝试超时也关闭该连接，重试只允许在新连接；这以额外连接成本换取简单、可验证的迟到隔离。

完整帧和认证失败见 [vectors.json](vectors.json)。后续 T-05 必须以独立译码工具/真实抓包核验，不能仅依赖共享编解码器互测证明标准兼容。
