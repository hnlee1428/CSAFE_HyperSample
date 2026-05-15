cmake_minimum_required(VERSION 3.15)
project(finite_pop_backend)

set(CMAKE_CXX_STANDARD 17)
set(CMAKE_CXX_STANDARD_REQUIRED ON)

find_package(Drogon REQUIRED)

add_executable(finite_pop_backend main.cpp)
target_link_libraries(finite_pop_backend PRIVATE Drogon::Drogon)