//-- copyright
// OpenProject is a project management system.
// Copyright (C) 2012-2014 the OpenProject Foundation (OPF)
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License version 3.
//
// OpenProject is a fork of ChiliProject, which is a fork of Redmine. The copyright follows:
// Copyright (C) 2006-2013 Jean-Philippe Lang
// Copyright (C) 2010-2013 the ChiliProject Team
//
// This program is free software; you can redistribute it and/or
// modify it under the terms of the GNU General Public License
// as published by the Free Software Foundation; either version 2
// of the License, or (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU General Public License for more details.
//
// You should have received a copy of the GNU General Public License
// along with this program; if not, write to the Free Software
// Foundation, Inc., 51 Franklin Street, Fifth Floor, Boston, MA  02110-1301, USA.
//
// See doc/COPYRIGHT.rdoc for more details.
//++

module.exports = function($timeout) {
  return {
    restrict: 'A',
    transclude: false,
    templateUrl: "/templates/components/inplace_editor.html",
    scope: {
      type: "@inedType",
      entity: "=inedEntity",
      attribute: "@inedAttribute"
    },
    link: link,
    controller: Controller
  };

  function link(scope, element, attrs) {
    element.on("click", ".ined-read-value", function() {
      scope.$apply(function() {
        scope.startEditing();
      });
    });
    element.bind("keydown keypress", function(e) {
      if (e.keyCode == 27) {
        scope.$apply(function() {
          scope.discardEditing();
        });
      }
    });

    scope.$on('startEditing', function() {
      $timeout(function() {
        element.find(".ined-input-wrapper input, .ined-input-wrapper textarea").focus();
      });
    });
    scope.$on('finishEditing', function() {
      $timeout(function() {
        element.find(".ined-read-value a").focus();
      });
    });
  }

  Controller.$inject = ['$scope', 'WorkPackageService', 'ApiHelper'];
  function Controller($scope, WorkPackageService, ApiHelper) {
    $scope.isEditing = false;
    $scope.isBusy = false;
    $scope.readValue = "";
    $scope.editTitle = I18n.t('js.inplace.button_edit');
    $scope.saveTitle = I18n.t('js.inplace.button_save');
    $scope.saveAndSendTitle = I18n.t('js.inplace.button_save_and_send');
    $scope.cancelTitle = I18n.t('js.inplace.button_cancel');
    $scope.error = null;

    $scope.startEditing = startEditing;
    $scope.discardEditing = discardEditing;
    $scope.submit = submit;
    $scope.onSuccess = onSuccess;
    $scope.onFail = onFail;
    $scope.onFinally = onFinally;

    activate();

    function activate() {
      // ng-model works weird with isolated scope
      // also it's better to make an intermediate container
      // to avoid live editing
      setWriteValue();
      setReadValue();
    }

    function startEditing() {
      setWriteValue();
      $scope.isEditing = true;
      $scope.error = null;
      $scope.isBusy = false;
      $scope.$broadcast('startEditing');
    }

    function submit(withEmail) {
      var data = {};
      data[$scope.attribute] = $scope.dataObject.value;
      data.lockVersion = $scope.entity.props.lockVersion;
      $scope.isBusy = true;
      var result = WorkPackageService.updateWorkPackage($scope.entity, data);
      result.then(function(workPackage) {
        $scope.onSuccess(workPackage);
      });
      result.catch(function(e) {
        $scope.onFail(e);
      });
      result.finally(function() {
        $scope.onFinally();
      });
    }

    function onSuccess(workPackage) {
      angular.extend($scope.entity, workPackage);
      $scope.dataObject.value = $scope.entity.props[$scope.attribute];
      $scope.error = null;
      setReadValue();
      finishEditing();
      $scope.$emit("workPackageRefreshRequired");
    }

    function onFail(e) {
      $scope.error = ApiHelper.getErrorMessage(e);
    }

    function onFinally() {
      $scope.isBusy = false;
    }

    function discardEditing() {
      finishEditing();
    }

    function finishEditing() {
      $scope.isEditing = false;
      $scope.$broadcast('finishEditing');
    }

    function setWriteValue() {
      $scope.dataObject = {
        value: $scope.entity.props[$scope.attribute]
      };
    }

    function setReadValue() {
      $scope.readValue = $scope.dataObject.value;
    }
  }
};
