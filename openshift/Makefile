PROJECT=sc-avo2
GIT_VERSION=`git describe --tags`
REPO_URI=https://github.com/viaacode/avo2-client.git
GIT_NAME=avo2-client
okd_registry=docker-registry-default.apps.do-prd-okp-m0.do.viaa.be
ENDPOINT=https://c100-e.eu-de.containers.cloud.ibm.com:31240
okd_endpoint=https://do-prd-okp-m0.do.viaa.be:8443
oc_registry=docker-registry-default.meemoo-596946-2bc857e5f10eb63ab790a3a1d19a696c-0001.eu-de.containers.appdomain.cloud
.ONESHELL:
SHELL = /bin/bash
.PHONY:	all
check-env:
ifndef ENV
  ENV=int
endif
check-prxyurl:
ifndef PROXY_URL
  PROXY_URL=http://avo2-proxy-${ENV}-sc-avo2.apps.do-prd-okp-m0.do.viaa.be
endif
OC_PROJECT=sc-avo2
ifndef BRANCH
  BRANCH=master
endif
TAG=${ENV}
current_qas_version=`oc rollout status deploymentconfig avo2-client-qas| awk '{print $3}'| sed 's/"//g'`
CMD_INT_TEST="npm run integration-tests"
CMD_UNIT_TEST="npm run integration-tests"

login:	check-env
	login_oc.sh ${ENDPOINT} > /dev/null 2>&1 && oc project "${OC_PROJECT}"

build:
	docker build --build-arg NODE_ENV=int . -t ${oc_registry}/sc-avo2/avo2-client:${GIT_VERSION}
	docker tag ${oc_registry}/sc-avo2/avo2-client:${GIT_VERSION} ${okd_registry}/sc-avo2/avo2-client:${GIT_VERSION}
push_oc:
	login_oc.sh ${ENDPOINT} > /dev/null 2>&1  && oc project sc-avo2
	docker push ${oc_registry}/sc-avo2/avo2-client:${GIT_VERSION} || docker push ${oc_registry}/sc-avo2/avo2-client:${GIT_VERSION}
push_okd:
	login_oc.sh ${okd_endpoint} > /dev/null 2>&1  && oc project sc-avo2
	docker push ${okd_registry}/sc-avo2/avo2-client:${GIT_VERSION} || docker push ${okd_registry}/sc-avo2/avo2-client:${GIT_VERSION}
tag_int:
	oc tag sc-avo2/avo2-client:${GIT_VERSION} sc-avo2/avo2-client:int
tag_dev:
	oc tag sc-avo2/avo2-client:${GIT_VERSION} sc-avo2/avo2-client:dev
rollout_dev:
	bash  ./openshift/wait4rollout.sh dev
rollout_int:
	echo not implemented
tag_staging:	login
	oc tag sc-avo2/avo2-client:${GIT_VERSION} sc-avo2/avo2-client:qas
staging:	tag_staging
	bash  ./openshift/wait4rollout.sh qas
versions_qas:
	bash ./openshift/versions.sh qas
versions_prd:
	bash ./openshift/versions.sh prd
int_test:
	bash ./openshift/cy-openshift.sh
unit_test:
	bash ./openshift/unittest-openshift.sh
anno_qas:	login versions_qas
anno_prd:	login versions_prd
