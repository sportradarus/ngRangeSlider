(function($angular, _) {

    "use strict";

    $angular.module('ngRangeSlider', []).directive('rangeSlider', ['$window', function ngRangeSlider($window) {

        return {
            restrict: 'EA',

            controller: ['$scope', function controller($scope) {

                $scope.iter = function iter(max) {
                    var iterator = [];
                    for (var index = 0; index <= max; index++) {
                        iterator.push(index);
                    }
                    return iterator;
                };

                $scope._notInRunLoop = function _notInRunLoop() {
                    return !$scope.$root.$$phase;
                };

                $scope._supportThrottle = function _supportThrottle() {
                    return ($angular.isDefined(_) && typeof _.throttle === 'function');
                };

            }],

            template: '<section><datalist id="numbers"><option ng-repeat="index in iter(max)">{{index}}</option></datalist><input list="numbers" type="range" ng-change="_which = 0" ng-model="_model[0]" min="{{_values.min}}" max="{{_values.max}}" step="{{_step}}" /><input type="range" ng-change="_which = 1" ng-model="_model[1]" min="{{_values.min}}" max="{{_values.max}}" step="{{_step}}" /></section>',
            replace: true,
            require: 'ngModel',
            scope: {
                model: '=ngModel',
                throttle: '=',
                settings: '=',
                step: '=',
                round: '=',
                init: '=',
                max: '=',
                min: '='
            },

            link: function link(scope, element) {

                if (scope.settings) {
                    scope.step = scope.settings.step;
                    scope.init = scope.settings.default;
                    scope.min = scope.settings.min;
                    scope.max = scope.settings.max;
                } else {
                    scope._step = scope.step || 1;
                }

                scope._round = scope.round || false;
                

                if ($angular.isArray(scope.model)) {
                    scope._model = [scope.model[0], scope.model[1]];
                } else if (scope.model && scope.model.from && scope.model.to) {
                    scope._model = [scope.model.from, scope.model.to];
                } else {
                    scope._model = [scope.init[0], scope.init[1]];
                }

                scope._values = { min: scope.min || 0, max: scope.max || 100 };
                

                var _reevaluateInputs = function _reevaluateInputs() {

                    var inputElements = element.find('input');
                    $angular.forEach(inputElements, function forEach(inputElement, index) {
                        inputElement = $angular.element(inputElement);
                        inputElement.val('');
                        inputElement.val(scope._model[index]);
                    });

                };

                // Listen for any changes to the original model.
                scope.$watch('model', function alteredValues() {
                    
                    if ($angular.isArray(scope.model)) {
                        scope._model = [scope.model[0], scope.model[1]];
                    } else if (scope.model && scope.model.from && scope.model.to) {
                        scope._model = [scope.model.from, scope.model.to];
                    }

                    _reevaluateInputs();
                }, true);

                
                var updateMinMax = function updateMinMax() {
                    scope._values[this] = scope[this];
                    _reevaluateInputs();
                };

                // Listen for changes to the min/max models.
                scope.$watch('min', updateMinMax.bind('min'));
                scope.$watch('max', updateMinMax.bind('max'));

                scope._which = 0;

                var _updateModel = function _updateModel(model) {

                    if ($angular.isArray(scope.model)) {
                        scope.model = [model[0], model[1]];
                    } else {
                        scope.model = { from: model[0], to: model[1] };
                    }

                    if (scope._notInRunLoop()) {

                        try {
                            scope.$apply();
                        } catch(e) {}

                    }

                };

                if (scope.throttle && scope._supportThrottle()) {

                    // Use the throttled version if we support it, and the developer has defined
                    // the throttle attribute.
                    _updateModel = _.throttle(_updateModel, $window.parseFloat(scope.throttle));

                }

                // Observe the `_model` for any changes.
                scope.$watchCollection('_model', function modelChanged() {

                    scope._model[0] = $window.parseFloat(scope._model[0]);
                    scope._model[1] = $window.parseFloat(scope._model[1]);

                    if (scope._round) {
                        scope._model[0] = Math.round(scope._model[0]);
                        scope._model[1] = Math.round(scope._model[1]);                        
                    }

                    // User was moving the first slider.
                    if (scope._which === 0 && scope._model[1] < scope._model[0]) {
                        scope._model[1] = scope._model[0];
                    }

                    // Otherwise they were moving the second slider.
                    if (scope._which === 1 && scope._model[0] > scope._model[1]) {
                        scope._model[0] = scope._model[1];
                    }

                    // Constrain to the min/max values.
                    (function constrainMinMax() {

                        if (scope._model[0] < scope._values.min) {
                            scope._model[0] = scope._values.min
                        }

                        if (scope._model[1] < scope._values.min) {
                            scope._model[1] = scope._values.min
                        }

                        if (scope._model[0] > scope._values.max) {
                            scope._model[0] = scope._values.max
                        }

                        if (scope._model[1] > scope._values.max) {
                            scope._model[1] = scope._values.max
                        }

                    })();

                    // Update the model!
                    _updateModel(scope._model);

                });

            }

        };

    }]);

})(window.angular, window._);