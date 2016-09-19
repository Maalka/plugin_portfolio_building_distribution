/**
 *  Sample Building Type Distribution Plugin
 */
define(['angular',
		'./directives/portfolio_building_distribution',
		'common'],
	function(angular) {
		'use strict';
		return angular.module('maalka.portfolioBuildingDistribution', ['portfolioBuildingDistribution.directives']);
	}
);