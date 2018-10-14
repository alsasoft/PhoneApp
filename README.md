# Phone APP API
Written by Manuel Hoyo Estévez.

  - NodeJS 8.12.0
  - MySql 5.7.18
  - Docker and Docker-Compose

## Startup
```sh
docker-compose up
```

This command will create 4 docker containers:
  - MySql (in port 3306), with database 'challenge' and data
  - PhpMyadmin (in port 8080) linked to MySql above
  - Phones API (in port 8081)
  - Orders API (in port 8082)

## Endpoints
  - [GET]  http://localhost:8081/api/phone/?page=0&page_size=10: Get the phone list in catalog.
    - page=0: Parameter page is zero based page.
    - page_size=10: Parameter page_size is the number of elements per page. If it is 0, it retrieves all elements.
    - _id=2&_id=43&_id=12: Parameter _id is used to get specific elements,
  - [POST] http://localhost:8082/api/order/
    - Paraments encoded in JSON: {
	"name": "Bartolo",
	"surname": "Diaz",
	"email" : "bartolo@diaz.com",
	"phones": [21, 21, 65, 87, 98]
}
