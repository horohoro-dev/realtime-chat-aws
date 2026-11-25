# すべての Makefile が最初に読み込む共通の設定。
# 使い方: 各ディレクトリの Makefile で ROOT_DIR を決めてから include する。
#   ROOT_DIR := ../
#   include $(ROOT_DIR)mk/common.mk

ifndef COMMON_MK_INCLUDED
COMMON_MK_INCLUDED := 1

MK_DIR := $(dir $(abspath $(lastword $(MAKEFILE_LIST))))
REPO_ROOT := $(abspath $(MK_DIR)..)

SHELL := bash
.SHELLFLAGS := -eu -o pipefail -c
.DEFAULT_GOAL := help
MAKEFLAGS += --no-print-directory

GIT_COMMIT_HASH ?= $(shell git -C $(REPO_ROOT) rev-parse --short=12 HEAD 2>/dev/null)

# デプロイ先の環境。AWS に触る入口は ENV を必須にする
ENVS := dev prd

# 「## 」の付いた入口だけを一覧にする。include した .mk の入口も出る
help: ## 入口の一覧を表示する
	@grep -hE '^[a-zA-Z0-9_-]+:.*## ' $(MAKEFILE_LIST) \
		| awk -F':.*## ' '!seen[$$1]++ {printf "  make %-18s %s\n", $$1, $$2}'

.PHONY: help

.check-env:
ifeq ($(filter $(ENV),$(ENVS)),)
	$(error ENV に $(ENVS) のどれかを指定してください。例: make $(MAKECMDGOALS) ENV=dev)
endif

# $(call require-cmd,uv) のように使う。コマンドがなければ、入れ方の案内を出して止める
define require-cmd
	@command -v $(1) >/dev/null 2>&1 || { echo "$(1) がありません。リポジトリ直下で mise install を実行してください" >&2; exit 1; }
endef

endif
