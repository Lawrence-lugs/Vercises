docker run -d --name vercises-dev -p 80:80 `
  -v ${PWD}/client:/app/client `
  -v ${PWD}/server:/app/server `
  -v ${PWD}/exercises:/app/exercises `
  vercises