---
title: 从零开始在CentOS7服务器上搭建GPU深度学习环境，并部署bert向量化服务
tags: 
  - linux
  - python
  - gpu
  - 中文
urlname: build-gpu-deep-learning-environment-and-deploy-bert-service-on-centos7
language: zh-CN 
date: 2021-01-04 00:00:00
---

## 0 前言
这篇文档将以centos7服务器为例，介绍搭建GPU深度学习环境，并部署bert向量化服务[bert-as-service](https://github.com/hanxiao/bert-as-service)的步骤，以及搭建过程中遇到的一些问题和解决方法，给后续在其他机器上的部署提供参考。

<!--more-->

最近公司的研究项目有对文本进行BERT向量化的需求，在github上找到了[bert-as-service](https://github.com/hanxiao/bert-as-service)这个开源项目，它提供pip安装，可以将bert向量化作为服务部署在服务器上，在客户端python脚本中通过简单的调用请求就可以得到词向量。相比自己调用bert源码，这种方法方便非常多。可以参考这篇知乎文章：[两行代码玩转Google BERT句向量词向量](https://zhuanlan.zhihu.com/p/50582974)

搭建完成后，生产力有了质的飞跃：在本地的cpu机器上，处理一段中文短文本大约需要1s，而单卡gpu服务器上只需要30多秒就可以处理1000段短文本。

注意：
- 一定要先切换到一个临时目录，因为bert-service会产生很多临时文件在当前文件夹下
- 需要开放5555、5556端口（默认）

## 1 GPU环境搭建
### 1.1 准备工作
查看系统位数
```
$ uname -a
Linux node14 3.10.0-1127.el7.x86_64 #1 SMP Tue Mar 31 23:36:51 UTC 2020 x86_64 x86_64 x86_64 GNU/Linux
```
可以看到，服务器是x86_64架构，接下来的包都可以安装。

查看linux发行版本（以centOS为例）
```
$ cat /etc/centos-release
CentOS Linux release 7.8.2003 (Core)
```
实际上，服务器深度学习环境更多使用的是Ubuntu。本文从实际情况出发，介绍在CentOS 7.x上的部署。

查看显卡信息
```
$ lspci  | grep -i vga
01:00.0 VGA compatible controller: NVIDIA Corporation TU102 [GeForce RTX 2080 Ti Rev. A] (rev a1)
```
***注意***，以下的环境搭建基于NVIDIA显卡。其他品牌的显卡虽然有其他框架可以使用，但还不成熟。

可以看到，214服务器的显卡为2080Ti，是不错的显卡~~不拿来做深度学习可惜了~~，但是服务器通常只是在跑一些内存任务，显卡没有得到充分利用。

### 1.2 安装Anaconda/miniconda
安装Anaconda/miniconda用于管理环境。这一步通常不会有什么问题。考虑到服务器上不需要装那么多乱七八糟的包，安装了miniconda3。

* [miniconda下载](https://docs.conda.io/en/latest/miniconda.html)
* [miniconda安装文档-linux](https://conda.io/projects/conda/en/latest/user-guide/install/linux.html)

*安装conda的一个好处是，在activate/deactivate某个虚拟环境的时候，可以执行特定的脚本，这将有助于我们在不同环境中使用不同CUDA版本，而不需要每次都手动修改环境变量，这将在下文详细介绍。参考：[Multiple Version of CUDA Libraries On The Same Machine](https://blog.kovalevskyi.com/multiple-version-of-cuda-libraries-on-the-same-machine-b9502d50ae77)*

### 1.3 安装CUDA和cuDNN
务必**不要直接安装最新版CUDA工具包**，这是个巨坑。tensorflow和pytorch的不同版本都对应不同的CUDA版本，假如CUDA版本不匹配，可能会出现无法正常使用GPU进行计算的情况。（这就是我最初部署bert-service时，显示worker是GPU，但实际仍然在CPU上进行计算的原因。服务可以正常跑起来，处理请求的时候CPU直接拉满。）

* [各版本CUDA下载](https://developer.nvidia.com/cuda-toolkit-archive)
* [cuDNN下载](https://developer.nvidia.com/rdp/cudnn-download)，注意和CUDA版本的对应（cuDNN安装较新的版本可以覆盖旧的版本，没有报错），下载需要注册NVIDIA developer。
* [CUDA 11.0安装文档](https://docs.nvidia.com/cuda/archive/11.0/cuda-installation-guide-linux/index.html)
* [CUDA 10.0安装文档](https://docs.nvidia.com/cuda/archive/10.0/cuda-installation-guide-linux/index.html)
* [cuDNN 8.0.5安装文档](https://docs.nvidia.com/deeplearning/cudnn/install-guide/index.html#troubleshoot)

请务必参照tensorflow、pytorch官方文档，选择合适的CUDA版本进行安装。

* tensorflow-gpu版本和CUDA版本的对应：[官方文档](https://www.tensorflow.org/install/source#common_installation_problems)
* [pytorch官网](https://pytorch.org)，注意不同CUDA版本对应的安装命令有所不同！选择合适的版本，会有对应的conda/pip安装命令

CUDA可以同时安装多个版本，使用时根据需要配置环境变量，例如214服务器上就安装了10.0和11.0两个版本。安装多版本CUDA**建议使用runfile安装**，安装选项选择不安装Driver（因为系统里已经有Driver，即显卡驱动了）。使用rpm安装可能因为已安装相同的包而产生冲突。

以最终部署在214服务器上的版本为例，tensorflow-gpu 1.14.0版本对应CUDA 10.0。cuDNN的版本只需要7.4以上即可。最终我安装的是CUDA 11.0对应的cuDNN 8版本，运行没有问题。

CUDA的默认安装路径为`/usr/local/cuda-xx.x/`，其中`xx.x`为版本号。**注意**CUDA安装完成后必须手动配置环境变量，切换CUDA版本也只需要更改环境变量，比如
```
$ export PATH=/usr/local/cuda-11.0/bin${PATH:+:${PATH}}
$ export LD_LIBRARY_PATH=/usr/local/cuda-11.0/lib64\
    ${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
```
和
```
$ export PATH=/usr/local/cuda-10.0/bin${PATH:+:${PATH}}
$ export LD_LIBRARY_PATH=/usr/local/cuda-10.0/lib64\
    ${LD_LIBRARY_PATH:+:${LD_LIBRARY_PATH}}
```
就实现了CUDA 11.0和10.0版本的切换。

要查看当前的runtime CUDA版本可以通过
```
$ nvcc -V
nvcc: NVIDIA (R) Cuda compiler driver
Copyright (c) 2005-2020 NVIDIA Corporation
Built on Thu_Jun_11_22:26:38_PDT_2020
Cuda compilation tools, release 11.0, V11.0.194
Build cuda_11.0_bu.TC445_37.28540450_0
```

## 2 【非常重要】确保tensorflow可以正常使用GPU
在python中测试tensorflow、pytorch是否可以使用GPU：
```
>>> import tensorflow as tf
>>> tf.test.is_gpu_available()
>>> import torch
>>> torch.cuda.is_available()
```

这里以tensorflow为例。

假如不能正常使用GPU，`tf.test.is_gpu_available()`会显示报错信息，比如，在CUDA 10.0环境下，tensorflow1.14.0
```
>>> import tensorflow as tf
>>> tf.test.is_gpu_available()
......
2020-12-01 10:26:58.163460: I tensorflow/stream_executor/platform/default/dso_loader.cc:53] Could not dlopen library 'libcudnn.so.7'; dlerror: libcudnn.so.7: cannot open shared object file: No such file or directory; LD_LIBRARY_PATH: /usr/local/cuda-10.0/lib64:/usr/local/cuda-10.0/extras/CUPTI/lib64:/usr/local/cuda-11.0/lib64
2020-12-01 10:26:58.163474: W tensorflow/core/common_runtime/gpu/gpu_device.cc:1663] Cannot dlopen some GPU libraries. Skipping registering GPU devices...
2020-12-01 10:26:58.163490: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1181] Device interconnect StreamExecutor with strength 1 edge matrix:
2020-12-01 10:26:58.163498: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1187]      0 
2020-12-01 10:26:58.163510: I tensorflow/core/common_runtime/gpu/gpu_device.cc:1200] 0:   N 
False
```
因为找不到`libcudnn.so.7`文件，所以GPU不可用。通过创建一个软链接，可以解决这个问题。首先，找到libcudnn的安装位置，以rpm安装的cudnn为例（网上有通过tgz安装的解决方法，然而我在官网只看到了rpm安装包）
```
$ rpm -ql libcudnn8
/usr/lib64/libcudnn.so.8
/usr/lib64/libcudnn.so.8.0.5
/usr/lib64/libcudnn_adv_infer.so.8
/usr/lib64/libcudnn_adv_infer.so.8.0.5
/usr/lib64/libcudnn_adv_train.so.8
/usr/lib64/libcudnn_adv_train.so.8.0.5
/usr/lib64/libcudnn_cnn_infer.so.8
/usr/lib64/libcudnn_cnn_infer.so.8.0.5
/usr/lib64/libcudnn_cnn_train.so.8
/usr/lib64/libcudnn_cnn_train.so.8.0.5
/usr/lib64/libcudnn_ops_infer.so.8
/usr/lib64/libcudnn_ops_infer.so.8.0.5
/usr/lib64/libcudnn_ops_train.so.8
/usr/lib64/libcudnn_ops_train.so.8.0.5
```

然后，创建软链接
```
$ ln -s /usr/lib64/libcudnn.so /usr/local/cuda-10.0/lib64/libcudnn.so.7
```
再次测试，返回结果为True。

又比如，在CUDA 11.0环境下，tensorflow-gpu 2.3.1，import提示
```
>>> import tensorflow as tf
2020-12-01 16:35:49.357365: W tensorflow/stream_executor/platform/default/dso_loader.cc:59] Could not load dynamic library 'libcudart.so.10.1'; dlerror: libcudart.so.10.1: cannot open shared object file: No such file or directory; LD_LIBRARY_PATH: /usr/local/cuda-11.0/lib64
2020-12-01 16:35:49.357395: I tensorflow/stream_executor/cuda/cudart_stub.cc:29] Ignore above cudart dlerror if you do not have a GPU set up on your machine.
```
创建软链接
```
$ ln -s /usr/local/cuda-11.0/lib64/libcudart.so /usr/local/cuda-11.0/lib64/libcudart.so.10.1
```
再次尝试
```
>>> import tensorflow as tf
2020-12-01 16:40:30.623510: I tensorflow/stream_executor/platform/default/dso_loader.cc:48] Successfully opened dynamic library libcudart.so.10.1
>>> tf.test.is_gpu_available()
......
2020-12-01 16:41:20.527629: W tensorflow/stream_executor/platform/default/dso_loader.cc:59] Could not load dynamic library 'libcusparse.so.10'; dlerror: libcusparse.so.10: cannot open shared object file: No such file or directory; LD_LIBRARY_PATH: /usr/local/cuda-11.0/lib64
2020-12-01 16:41:20.527687: W tensorflow/stream_executor/platform/default/dso_loader.cc:59] Could not load dynamic library 'libcudnn.so.7'; dlerror: libcudnn.so.7: cannot open shared object file: No such file or directory; LD_LIBRARY_PATH: /usr/local/cuda-11.0/lib64
......
False
```
创建软链接
```
$ ln -s /usr/local/cuda-11.0/lib64/libcublas.so /usr/local/cuda-11.0/lib64/libcublas.so.10
$ ln -s /usr/lib64/libcudnn.so /usr/local/cuda-11.0/lib64/libcudnn.so.7
$ ln -s /usr/local/cuda-11.0/lib64/libcusparse.so /usr/local/cuda-11.0/lib64/libcusparse.so.10
```
再次测试
```
>>> import tensorflow as tf
2020-12-01 16:40:30.623510: I tensorflow/stream_executor/platform/default/dso_loader.cc:48] Successfully opened dynamic library libcudart.so.10.1
>>> tf.test.is_gpu_available()
......
True
```
**总而言之，缺什么`libxxxx`只需要在缺少文件的路径下创建一个软链接到（更高版本的）同名文件。**

参考：
* [【UBUNTU深度学习环境】ImportError: libcudnn.so.7: cannot open shared object file: No such file or directory](https://blog.csdn.net/weixin_40298200/article/details/79420758)
* [【pytorch】libcudart.so.10.1: cannot open shared object file: No such file or directory](https://blog.csdn.net/qq_27481295/article/details/102799977)


## 3 bert-as-service的部署与使用
### 3.1 conda创建虚拟环境
#### 3.1.1 创建python 3.6虚拟环境
（python 3.7中tensorflow 1.14.0或之前版本import会报错），激活环境。
```
$ conda create -n bertservice -python=3.6
$ conda activate bertservice
```

#### 3.1.2 【可选】设定pip国内镜像
比如豆瓣。
```
$ pip config set global.index-url https://pypi.douban.com/simple
```

#### 3.1.3 安装tensorflow-gpu 1.x
（因为2.x版本无法正常启动bert-service）。***注意***，tensorflow一定一定要安装**gpu版本**，假如已经装了cpu版本，请卸载之，否则就算装了gpu版，import的还是cpu版。
```
$ pip install tensorflow-gpu==1.14.0
```

#### 3.1.4 服务端只需要安装bert-serving-server包。
```
$ pip install bert-serving-server
```

#### 3.1.5 配置activate/deactivate虚拟环境时自动修改环境变量的脚本
这样，CUDA版本切换后无需手动配置环境变量。

参考：
* [Multiple Version of CUDA Libraries On The Same Machine](https://blog.kovalevskyi.com/multiple-version-of-cuda-libraries-on-the-same-machine-b9502d50ae77)
* [非root用户在linux下安装多个版本的CUDA和cuDNN（cuda 8、cuda 10.1 等）](https://blog.csdn.net/hizengbiao/article/details/88625044)

操作步骤：

1. cd到conda创建的环境目录下。例如
```
$ cd ~/miniconda3/envs/bertservice
```

2. 创建目录和脚本文件
```
$ mkdir ./etc/conda/activate.d
$ mkdir ./etc/conda/deactivate.d
$ touch ./etc/conda/activate.d/activate.sh
$ touch ./etc/conda/deactivate.d/deactivate.sh
```
脚本文件内容如下：

`activate.sh`
```
#!/bin/sh
export PATH=/usr/local/cuda-10.0/bin${PATH:+:${PATH}}
ORIGINAL_LD_LIBRARY_PATH=$LD_LIBRARY_PATH
export LD_LIBRARY_PATH=/usr/local/cuda-10.0/lib64:/usr/local/cuda-10.0/extras/CUPTI/lib64
```
`deactivate.sh`
```
#!/bin/sh
export PATH=/usr/local/cuda-11.0/bin${PATH:+:${PATH}}
export LD_LIBRARY_PATH=$ORIGINAL_LD_LIBRARY_PATH
unset ORIGINAL_LD_LIBRARY_PATH
```
这里，11.0是`base`环境的CUDA版本，10.0是`bertservice`环境的CUDA版本。

### 3.2 服务端启动服务
启动服务，需要指定模型路径，提前下载bert参数文件，我们需要用到的是中文的[BERT-Base, Chinese](https://storage.googleapis.com/bert_models/2018_11_03/chinese_L-12_H-768_A-12.zip)。关于api的详细说明请参考[bert-service的github官方文档](https://github.com/hanxiao/bert-as-service)。

启动命令例：模型路径、worker数量、向客户端返回token（实际情况下不需要，因为中文bert是字级别的）、不限制句子长度（最大长度是512，超过的部分将会被截断）
```
$ bert-serving-start -model_dir ~/models/chinese_L-12_H-768_A-12/ -num_worker=1 -show_tokens_to_client -max_seq_len=None
```

### 3.3 客户端调用
客户端只需要安装bert-serving-client包
```
$ pip install bert-serving-client
```
然后在客户端python脚本中调用
```
>>> from bert_serving.client import BertClient
>>> bc = BertClient(ip='localhost') #服务器ip
>>> out = bc.encode(["其实从２０１１下半年开始，中国风就在表坛成为当仁不让的话题。"],show_tokens=False, is_tokenized=False)
```
***注意***，`bc.encode()`接收的参数类型是list。详细api请同样参考[文档](https://github.com/hanxiao/bert-as-service)。

## 4 遇到的其他问题
以下的问题，按照上述安装方法，应该不会遇到。

### 4.1 卸载CUDA的时候不小心把显卡驱动（NVIDIA Driver）一并卸载了
重装显卡驱动：上[官网](https://www.nvidia.cn/Download/index.aspx)找到显卡对应的驱动，下载，重装。安装完成后，可以正常执行`nvidia-smi`命令，查看显卡情况，不需要reboot。~~服务器还在执行别的任务，不能重启，差点以为把服务器玩坏了。~~
```
$ nvidia-smi
Tue Dec  1 15:05:55 2020       
+-----------------------------------------------------------------------------+
| NVIDIA-SMI 450.80.02    Driver Version: 450.80.02    CUDA Version: 11.0     |
|-------------------------------+----------------------+----------------------+
| GPU  Name        Persistence-M| Bus-Id        Disp.A | Volatile Uncorr. ECC |
| Fan  Temp  Perf  Pwr:Usage/Cap|         Memory-Usage | GPU-Util  Compute M. |
|                               |                      |               MIG M. |
|===============================+======================+======================|
|   0  GeForce RTX 208...  Off  | 00000000:01:00.0 Off |                  N/A |
| 12%   58C    P0    41W / 250W |      0MiB / 11011MiB |      0%      Default |
|                               |                      |                  N/A |
+-------------------------------+----------------------+----------------------+
                                                                               
+-----------------------------------------------------------------------------+
| Processes:                                                                  |
|  GPU   GI   CI        PID   Type   Process name                  GPU Memory |
|        ID   ID                                                   Usage      |
|=============================================================================|
|  No running processes found                                                 |
+-----------------------------------------------------------------------------+
```

### 4.2 nvidia-smi与nvcc -V显示的CUDA版本不一致
没毛病，`nvidia-smi`是Driver版本，`nvcc -V`是runtime版本。参考：[nvidia-smi 和 nvcc 结果的版本为何不一致](https://blog.csdn.net/ljp1919/article/details/102640512)

### 4.3 尝试使用docker中的tensorflow-gpu镜像
按照官方文档操作，docker并没有运行成功。最后放弃了该方法。

参考：
* https://www.tensorflow.org/install/docker
* https://docs.nvidia.com/datacenter/cloud-native/container-toolkit/install-guide.html#setting-up-docker-on-rhel-7

---

This is an archived post. Originally posted on [CSDN](https://blog.csdn.net/weixin_43538536/article/details/112193553).
