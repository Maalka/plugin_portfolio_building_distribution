define(['angular','d3', 'moment', 'highcharts', 'highcharts-drilldown'], function(angular, d3, moment) {
	'use strict';
	var mod = angular.module('portfolioBuildingDistribution.directives', []);
	mod.directive('portfolioBuildingDistribution', ['$log', '$timeout', '$interval', '$q', 'playRoutes', 'portfolioService', 'dataService', 'reportUtilities',
	function ($log, $timeout, $interval, $q, playRoutes, portfolioService, dataService, utilities) {
		return {
			restrict: 'A',
			replace: true,
			scope: {
				portfolioId: "=",
				ready: "="
			},
			templateUrl: "javascripts/portfolio_building_distribution/partials/portfolio_building_distribution.html",
			link: function (scope, element) {
				utilities.loadOrDeferScopeVariable(scope, "portfolioId").then(function (portfolioId) {
					return portfolioService.bootstrapPortfolio(portfolioId);
				}).then(function (portfolio) { 
					return portfolioService.portfolioEUI(portfolio);
				}).then(function (portfolio) {
					var propertyTypeEUI = {};
					var propertyTypeDistribution = {};
					portfolio.properties.forEach(function (property) { 
						if (property.eui !== undefined && property.eui.length > 0) {
							// group by year
							var group = d3.nest().key(function (v) { 
								return moment.utc(v.startTime).year();
							}).rollup(function (v) { 
								return d3.sum(v, function (a) { 
									return a.usage;
								});
							}).entries(property.eui).filter(function (value) { 
								return value.key === "2014";
							});
							if (group.length > 0) {
								var use = property.meta.primaryFunction;
								if (propertyTypeEUI[use] === undefined) { 
									propertyTypeEUI[use] = [group[0].values];
								} else {
									propertyTypeEUI[use].push(group[0].values);
								}
							}
						}
					});
					Object.keys(propertyTypeEUI).forEach(function (k) { 
						var euis = propertyTypeEUI[k].sort(function (a, b) {
							return a - b;
						});
						propertyTypeDistribution[k] = [
							d3.quantile(euis, 0.0),
							d3.quantile(euis, 0.25),
							d3.quantile(euis, 0.5),
							d3.quantile(euis, 0.75),
							d3.quantile(euis, 1)
						];
					});
					var categories = Object.keys(propertyTypeDistribution).sort(function (a, b){ 
						// sort by median eui;
						return propertyTypeDistribution[a][2] - propertyTypeDistribution[b][2];
					});
					var series = categories.map(function (key) { 
						return propertyTypeDistribution[key];
					});
					categories = categories.map(function (key) {
						return '<div class="item">' + key + ' &nbsp; <div class="ui blue label">' + 
								propertyTypeEUI[key].length + "</div></div>";
					});
					loadChart({'series': series, 'categories': categories});
				});
				var loadChart = function (data) {
					var options = {
						chart: {
							type: 'boxplot',
							inverted: true,
							height: d3.max([data.categories.length * 50, 400])
						},

						title: {
							text: 'Building Type EUI Distribution (2014)'
						},

						legend: {
							enabled: false
						},
						tooltip: {
							useHTML: true,
							valueDecimals: 1,
							shared: true,
							style: {'z-index': 9999},
							headerFormat: '<em>{point.key}</em><br/>',
							backgroundColor: "rgba(255,255,255,1)",
							formatter: function(tooltip) {
								var items = this.points || splat(this),
									s;
								// build the header
								s = [tooltip.tooltipFooterHeaderFormatter(items[0])];
								// build the values
								s = s.concat(tooltip.bodyFormatter(items));

								// footer
								s.push(tooltip.tooltipFooterHeaderFormatter(items[0], true));

								return s.join(" ");
							}
						},
						xAxis: {
							categories: data.categories,
							title: {
								text: 'Building Type',
								enabled: false
							},
							labels: {
								useHTML: true
							}
						},

						yAxis: {
							title: {
								text: 'EUI'
							}
						},

						series: [{
							name: 'EUI',
							data: data.series
						}]
					};
					$timeout(function () {
						angular.element(element).find(".highcharts-report").highcharts(options);
					});
				};
			}
		};
	}]);
});