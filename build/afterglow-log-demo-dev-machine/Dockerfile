FROM ubuntu:16.04
MAINTAINER Denys Metelskyy <denys.y.metelskyy@gmail.com>

RUN apt-get update

RUN apt-get install -y \
  build-essential \
  git \
  python-pip \
  nodejs \
  npm \
  nodejs-legacy

RUN npm install -g typescript

RUN pip install crossbar==16.10.1
RUN pip install autobahn==0.17.1
RUN pip install twisted==16.6.0

EXPOSE 8080 8080

WORKDIR /workspace
