docker stop vercises
docker rm vercises
docker build -t vercises .
docker run -d --name vercises -p 80:80 vercises