all:
	docker-compose up -d --build
	docker-compose ps

debug:
	docker-compose stop app
	docker-compose run --rm --service-ports exec app python manage.py runserver

resetdb:
	docker-compose exec db dropdb fun_cms -U fun
	docker-compose exec db createdb fun_cms -U fun
	docker-compose exec app python manage.py migrate
