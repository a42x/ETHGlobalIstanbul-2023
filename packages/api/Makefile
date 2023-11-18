login:
	gcloud auth login # login with your @a42x account first

init:
	# curl -fsSL https://bun.sh/install | bash # install Bun
	bun i # install dependencies
	gcloud components update --quiet # update gcloud components
	gcloud config set builds/use_kaniko True
	gcloud config set project a42x-playground # set project
	gcloud config set run/region asia-northeast1 # set region

bs:
	gcloud builds submit --tag asia-northeast1-docker.pkg.dev/a42x-playground/eth-global-istanbul/api:latest

deploy:
	$(MAKE) bs
	gcloud run deploy api-istanbul \
 		--image asia-northeast1-docker.pkg.dev/a42x-playground/eth-global-istanbul/api:latest \
 		--allow-unauthenticated --max-instances 1 --min-instances 1

deploy-dev-only:
	$(MAKE) bs
	gcloud run deploy api-istanbul --image asia-northeast1-docker.pkg.dev/a42x-playground/eth-global-istanbul/api:latest
