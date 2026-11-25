# コンテナイメージを ECR に登録し、ECS のデプロイで使う版を Parameter Store に記録する入口。
# サービスのディレクトリ（Dockerfile のあるところ）の Makefile から include する。
#   ROOT_DIR := ../
#   include $(ROOT_DIR)mk/aws.mk
#
# 人が手元で使う入口。AWS の認証は IAM Identity Center（aws sso login --profile $(AWS_PROFILE)）で行う。
# アカウント ID はリポジトリに書かず、ログイン中のプロファイルから引く。

include $(dir $(lastword $(MAKEFILE_LIST)))common.mk

AWS_REGION ?= ap-northeast-1
AWS_PROFILE ?= realtime-chat-$(ENV)
export AWS_REGION AWS_PROFILE

# 最初に使われたときに1回だけ aws sts を呼ぶ
AWS_ACCOUNT_ID ?= $(eval AWS_ACCOUNT_ID := $$(shell aws sts get-caller-identity --query Account --output text))$(AWS_ACCOUNT_ID)

# サービス名。指定がなければ Makefile のあるディレクトリの名前
SERVICE ?= $(notdir $(CURDIR))
DOCKERFILE ?= Dockerfile
DOCKER_PLATFORM ?= linux/amd64

IMAGE_REGISTRY = $(AWS_ACCOUNT_ID).dkr.ecr.$(AWS_REGION).amazonaws.com
IMAGE_REPOSITORY_URI = $(IMAGE_REGISTRY)/$(SERVICE)-$(ENV)
IMAGE_TAG ?= $(GIT_COMMIT_HASH)
# デプロイで使うイメージのタグを記録する Parameter Store の名前
IMAGE_TAG_PARAMETER = /realtime-chat/$(ENV)/$(SERVICE)/image-tag

aws-login: .check-env ## IAM Identity Center にログインする（例: make aws-login ENV=dev）
	aws sso login --profile $(AWS_PROFILE)

docker-login: .check-env ## ECR にログインする（例: make docker-login ENV=dev）
	aws ecr get-login-password --region $(AWS_REGION) \
		| docker login --username AWS --password-stdin $(IMAGE_REGISTRY)

build-image: .check-env .check-dockerfile ## イメージをビルドする。タグは今のコミット
	docker build --platform=$(DOCKER_PLATFORM) --provenance=false \
		-t $(IMAGE_REPOSITORY_URI):$(IMAGE_TAG) -f $(DOCKERFILE) .

push-image: .check-env ## イメージを ECR に push する
	docker push $(IMAGE_REPOSITORY_URI):$(IMAGE_TAG)

release-image: docker-login build-image push-image ## ビルドして ECR に push する（例: make release-image ENV=dev）

update-image-tag: .check-env ## デプロイで使うタグを Parameter Store に記録する
	aws ssm put-parameter --name $(IMAGE_TAG_PARAMETER) --value $(IMAGE_TAG) \
		--type String --overwrite > /dev/null

get-image-uri: .check-env ## Parameter Store に記録したタグのイメージの URI を出す
	@echo $(IMAGE_REPOSITORY_URI):$$(aws ssm get-parameter --name $(IMAGE_TAG_PARAMETER) --query Parameter.Value --output text)

.PHONY: aws-login docker-login build-image push-image release-image update-image-tag get-image-uri

.check-dockerfile:
	@test -f $(DOCKERFILE) || { echo "$(CURDIR)/$(DOCKERFILE) がありません" >&2; exit 1; }
