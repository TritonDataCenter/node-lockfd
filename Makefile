#
# This Source Code Form is subject to the terms of the Mozilla Public
# License, v. 2.0. If a copy of the MPL was not distributed with this
# file, You can obtain one at http://mozilla.org/MPL/2.0/.
#

#
# Copyright 2016, Joyent, Inc.
#

#
# node-lockfd Makefile
#

#
# Tools
#

TAPE	:= ./node_modules/.bin/tape
NPM	:= npm
export SHELL := /bin/bash

#
# Files
#

JS_FILES	:= $(shell find lib test -name '*.js')
JSSTYLE_FILES	= $(JS_FILES)
JSSTYLE_FLAGS	= -f tools/jsstyle.conf
ESLINT		= ./node_modules/.bin/eslint
ESLINT_CONF	= tools/eslint.node.conf
ESLINT_FILES	= $(JS_FILES)
JSON_FILES	:= package.json
LOCKFD_BINDING	:= ./lib/lockfd_binding.node

include ./tools/mk/Makefile.defs

TOP             := $(shell pwd)

#
# Repo-specific targets
#

.PHONY: all
all: $(LOCKFD_BINDING) | ./node_modules
	$(NPM) install

./node_modules:
	$(NPM) install

$(LOCKFD_BINDING): | ./node_modules
	cd src && make

$(ESLINT):
	$(NPM) install

$(TAPE):
	$(NPM) install

CLEAN_FILES += $(LOCKFD_BINDING) src/lockfd.o src/v8plus_errno.h ./node_modules

.PHONY: test
test: $(TAPE)
	@(for F in test/unit/*.test.js; do \
		echo "# $$F" ;\
		$(NODE_EXEC) $(TAPE) $$F ;\
		[[ $$? == "0" ]] || exit 1; \
	done)

.PHONY: check
check:: $(ESLINT)
	$(ESLINT) -c $(ESLINT_CONF) $(ESLINT_FILES)

# Ensure CHANGES.md and package.json have the same version.
.PHONY: versioncheck
versioncheck:
	@echo version is: $(shell cat package.json | json version)
	[[ `cat package.json | json version` == `grep '^## ' CHANGES.md | head -2 | tail -1 | awk '{print $$2}'` ]]

.PHONY: cutarelease
cutarelease: versioncheck
	[[ -z `git status --short` ]]  # If this fails, the working dir is dirty.
	@which json 2>/dev/null 1>/dev/null && \
	    ver=$(shell json -f package.json version) && \
	    name=$(shell json -f package.json name) && \
	    publishedVer=$(shell npm view -j $(shell json -f package.json name)@$(shell json -f package.json version) version 2>/dev/null) && \
	    if [[ -n "$$publishedVer" ]]; then \
		echo "error: $$name@$$ver is already published to npm"; \
		exit 1; \
	    fi && \
	    echo "** Are you sure you want to tag and publish $$name@$$ver to npm?" && \
	    echo "** Enter to continue, Ctrl+C to abort." && \
	    read
	ver=$(shell cat package.json | json version) && \
	    date=$(shell date -u "+%Y-%m-%d") && \
	    git tag -a "v$$ver" -m "version $$ver ($$date)" && \
	    git push --tags origin && \
	    npm publish

#
# Includes
#

include ./tools/mk/Makefile.deps
include ./tools/mk/Makefile.targ
