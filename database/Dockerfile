FROM postgres:9.4
COPY . /fixtures
WORKDIR /fixtures
RUN chmod +x /fixtures/setup.sh
RUN su postgres
RUN /fixtures/setup.sh