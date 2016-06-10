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
all: $(LOCKFD_BINDING) ./node_modules
	$(NPM) install

$(LOCKFD_BINDING):
	cd src && make

$(ESLINT):
	$(NPM) install

$(TAPE):
	$(NPM) install

CLEAN_FILES += $(TAPE) ./node_modules/tape $(LOCKFD_BINDING)

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

#
# Includes
#

include ./tools/mk/Makefile.deps
include ./tools/mk/Makefile.targ
