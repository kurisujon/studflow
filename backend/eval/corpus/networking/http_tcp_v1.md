---
source_id: networking-http-tcp-v1
title: HTTP and TCP Fundamentals
topic: networking
version: 1
---

# HTTP and TCP Fundamentals

<!-- anchor: networking/tcp-intro -->
The Transmission Control Protocol (TCP) is one of the main protocols of the Internet protocol suite. It originated in the initial network implementation in which it complemented the Internet Protocol (IP). Therefore, the entire suite is commonly referred to as TCP/IP. TCP provides reliable, ordered, and error-checked delivery of a stream of octets between applications running on hosts communicating via an IP network.

<!-- anchor: networking/tcp-handshake -->
To establish a connection, TCP uses a three-way handshake. Before a client attempts to connect with a server, the server must first bind to and listen at a port to open it up for connections (a passive open). Once the passive open is established, a client may initiate an active open. The three steps are SYN, SYN-ACK, and ACK.

<!-- anchor: networking/http-intro -->
The Hypertext Transfer Protocol (HTTP) is an application layer protocol in the Internet protocol suite model for distributed, collaborative, hypermedia information systems. HTTP is the foundation of data communication for the World Wide Web, where hypertext documents include hyperlinks to other resources that the user can easily access.

<!-- anchor: networking/http-methods -->
HTTP defines methods (sometimes referred to as verbs) to indicate the desired action to be performed on the identified resource. Common methods include GET, POST, PUT, DELETE, and PATCH. A GET request retrieves data, while a POST request submits data to the specified resource, often causing a change in state or side effects on the server.

<!-- anchor: networking/http-status-classes -->
HTTP response status codes indicate whether a specific HTTP request has been successfully completed. Responses are grouped in five classes: Informational responses (100–199), Successful responses (200–299), Redirection messages (300–399), Client error responses (400–499), and Server error responses (500–599).

<!-- anchor: networking/http-status-400s -->
Client error responses indicate that the request contains bad syntax or cannot be fulfilled. The 404 Not Found status code indicates that the server cannot find the requested resource. The 429 Too Many Requests status code indicates the user has sent too many requests in a given amount of time, commonly known as rate limiting.

<!-- anchor: networking/http-status-500s -->
Server error responses indicate that the server failed to fulfill a valid request. For example, 500 Internal Server Error is a generic error message, given when an unexpected condition was encountered and no more specific message is suitable. 502 Bad Gateway indicates that the server, while acting as a gateway or proxy, received an invalid response from the upstream server.
