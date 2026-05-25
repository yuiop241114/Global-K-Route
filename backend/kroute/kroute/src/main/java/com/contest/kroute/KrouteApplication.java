package com.contest.kroute;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.boot.context.properties.ConfigurationPropertiesScan;

@SpringBootApplication
@ConfigurationPropertiesScan
public class KrouteApplication {

	public static void main(String[] args) {
		SpringApplication.run(KrouteApplication.class, args);
	}

}
