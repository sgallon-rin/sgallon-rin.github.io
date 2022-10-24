---
title: "httpd重启失败No space left on device: AH00023: Couldn't create the ssl-cache mutex"
tags: 
  - linux
  - 中文
urlname: httpd-service-start-failed
language: zh-CN
date: 2020-12-25 00:00:00
---

httpd.service重启失败，报错信息如下：

<!--more-->

```
# service httpd start
Redirecting to /bin/systemctl start httpd.service
Job for httpd.service failed because the control process exited with error code. See "systemctl status httpd.service" and "journalctl -xe" for details.
# service httpd status
Redirecting to /bin/systemctl status httpd.service
● httpd.service - The Apache HTTP Server
   Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; vendor preset: disabled)
   Active: failed (Result: exit-code) since Tue 2020-11-24 10:23:57 CST; 5s ago
     Docs: man:httpd(8)
           man:apachectl(8)
  Process: 16430 ExecReload=/usr/sbin/httpd $OPTIONS -k graceful (code=exited, status=0/SUCCESS)
  Process: 14493 ExecStart=/usr/sbin/httpd $OPTIONS -DFOREGROUND (code=exited, status=1/FAILURE)
 Main PID: 14493 (code=exited, status=1/FAILURE)

Nov 24 10:23:57 izuf68hjhpsqp9dl4p2c9cz systemd[1]: Starting The Apache HTTP Server...
Nov 24 10:23:57 izuf68hjhpsqp9dl4p2c9cz systemd[1]: httpd.service: main process exited, code=exited, status=1/FAILURE
Nov 24 10:23:57 izuf68hjhpsqp9dl4p2c9cz systemd[1]: Failed to start The Apache HTTP Server.
Nov 24 10:23:57 izuf68hjhpsqp9dl4p2c9cz systemd[1]: Unit httpd.service entered failed state.
Nov 24 10:23:57 izuf68hjhpsqp9dl4p2c9cz systemd[1]: httpd.service failed.
```

查看错误日志：

```
# tail -f  /var/log/httpd/error_log
[Tue Nov 24 10:25:01.344079 2020] [suexec:notice] [pid 14748] AH01232: suEXEC mechanism enabled (wrapper: /usr/sbin/suexec)
[Tue Nov 24 10:25:01.344489 2020] [core:emerg] [pid 14748] (28)No space left on device: AH00023: Couldn't create the ssl-cache mutex 
AH00016: Configuration Failed
...
```

ipcs命令，查看apache分析消息队列、共享内存和信号量：

```
# ipcs -s | grep apache
0x00000000 163840     apache     600        1         
0x00000000 98305      apache     600        1         
0x00000000 2          apache     600        1         
0x00000000 98307      apache     600        1         
0x00000000 98308      apache     600        1         
0x00000000 98309      apache     600        1         
0x00000000 163846     apache     600        1         
0x00000000 163847     apache     600        1         
0x00000000 8          apache     600        1         
0x00000000 9          apache     600        1
...
```

删除apache分析消息队列、共享内存和信号量：

```
# ipcs -s | grep apache | perl -e 'while (<STDIN>) { @a=split(/\s+/); print `ipcrm sem $a[1]`}'
resource(s) deleted
resource(s) deleted
resource(s) deleted
resource(s) deleted
resource(s) deleted
resource(s) deleted
resource(s) deleted
resource(s) deleted
...
```

重启httpd，成功！

```
# service httpd restart
Redirecting to /bin/systemctl restart httpd.service
# service httpd status
Redirecting to /bin/systemctl status httpd.service
● httpd.service - The Apache HTTP Server
   Loaded: loaded (/usr/lib/systemd/system/httpd.service; enabled; vendor preset: disabled)
   Active: active (running) since Tue 2020-11-24 10:33:02 CST; 6s ago
     Docs: man:httpd(8)
           man:apachectl(8)
  Process: 16430 ExecReload=/usr/sbin/httpd $OPTIONS -k graceful (code=exited, status=0/SUCCESS)
 Main PID: 15687 (/usr/sbin/httpd)
```

参考文章：

[Apache排查问题：Apache ERROR: No space left on device: AH00023: Couldn't create the ssl-cache mutex](https://www.cnblogs.com/syy714363310/p/12202535.html)

[ipcs 命令](https://www.cnblogs.com/wangkangluo1/archive/2012/06/04/2535042.html)

---

This is an archived post. Originally posted on [CSDN](https://blog.csdn.net/weixin_43538536/article/details/111662494).