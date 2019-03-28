#
# Copyright 2019 Joyent, Inc.
#

PREFIX_NODE :=	$(shell dirname $$(bash -c 'hash node; hash -t node'))/..
V8PLUS :=       $(shell $(PREFIX_NODE)/bin/node -e 'require("v8plus");')

include $(V8PLUS)/Makefile.v8plus.defs

MODULE =	lockfd_binding

SRCS =	\
		lockfd.c

ERRNO_JSON =	errno.json

ifeq ($(shell uname -s),SunOS)
CC =		/opt/local/bin/gcc
CXX =		/opt/local/bin/g++
CFLAGS +=	-pthread -D__EXTENSIONS__
LIBS +=		-lumem
else
CC =		gcc
CXX =		g++
CTFCONVERT =	:
WARN_FLAGS +=	-Wno-error=sign-compare
endif

WARN_FLAGS +=	-Wno-error=unused-parameter

include $(V8PLUS)/Makefile.v8plus.targ
