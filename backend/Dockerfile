FROM amazoncorretto:17-alpine
COPY target/*.jar app.jar
ENTRYPOINT ["java", "--add-opens=java.base/java.io=ALL-UNNAMED", "-jar", "/app.jar"]
