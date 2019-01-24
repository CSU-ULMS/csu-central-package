angular.module('reportProblem', []);

angular.module('reportProblem').component('ocaReportProblem', {
  bindings: {
    messageText: '@',
    buttonText: '@',
    submitText: '@',
    reportUrl: '@',
    reportVendor: '@',
    alertLocation:'@',
    parentCtrl: '<'
  },
  require: {
    itemCtrl: '^prmFullViewServiceContainer'
  },
  template: `
  <div ng-if="$ctrl.show" class="bar filter-bar layout-align-center-center layout-row margin-top-medium" layout="row" layout-align="center center">
    <span class="margin-right-small">{{$ctrl.messageText}}</span>
    <button class="button-with-icon zero-margin md-button md-button-raised md-primoExplore-theme" type="button" aria-label="Report a Problem" ng-click="$ctrl.showReportForm()">
      <prm-icon icon-type="svg" svg-icon-set="action" icon-definition="ic_report_problem_24px"></prm-icon>
      <span>{{$ctrl.buttonText}}</span>
    </button>
  </div>
    <div class="alert-panel" ng-show="successMessagebool">
      <div class="alert-message">
        Submitted Successfully
        <button class="md-button md-primoExplore-theme md-ink-ripple" type="button" ng-click="$ctrl.ok()"><span>DISMISS</span><div class="md-ripple-container"></div></button>
      </div>
    </div>
    <div ng-if="$ctrl.showRPForm" class="send-actions-content-item report-problem-form-wrapper" layout="row">
      <md-content layout-wrap layout-padding layout-fill>
        <form name="$ctrl.reportForm" novalidate layout="column" layout-align="center center" (submit)="$ctrl.submitReport();">
          <div layout="row" class="layout-full-width" layout-align="center center">
            <div flex="10" flex-sm="5" hide-xs></div>
            <div class="form-focus service-form" layout-padding flex>
              <div layout-margin>
                <div layout="column">
                  <h4 class="md-subhead">Report a Problem</h4>
                  <md-input-container class="underlined-input" ng-if="$ctrl.requireName">
                    <label>Name:</label>
                    <input ng-model="$ctrl.name" name="name" type="text" >
                    <div ng-messages="reportForm.name.$error">
                      <div ng-message="required">please enter your name</div>
                    </div>
                  </md-input-container>
                <md-input-container class="underlined-input" ng-if="!$ctrl.requireName">
                  <label>Name:</label>
                  <input ng-model="$ctrl.name" name="name" type="text" >
                </md-input-container>
                <md-input-container class="underlined-input md-required" ng-if="$ctrl.requireEmail">
                  <label>Email:</label>
                  <input ng-model="$ctrl.email" name="email" type="text" required >
                  <div ng-messages="reportForm.email.$error">
                    <div ng-message="pattern, required ">email is invalid</div>
                  </div>
                </md-input-container>
                <md-input-container class="underlined-input" ng-if="!$ctrl.requireEmail">
                  <label>Email:</label>
                  <input ng-model="$ctrl.email" name="email" type="text" >
                </md-input-container>
                <md-input-container class="md-required" ng-if="$ctrl.requireDesc">
                  <label>Description:</label>
                  <textarea ng-model="$ctrl.description" name="description" required></textarea>
                  <div ng-messages="reportForm.description.$error">
                    <div ng-message="required">please enter your problem description</div>
                  </div>
                </md-input-container>
                <md-input-container ng-if="!$ctrl.requireDesc">
                  <label>Description:</label>
                  <textarea ng-model="$ctrl.description" name="description"></textarea>
                </md-input-container>
                <md-input-container class="underlined-input" ng-if="$ctrl.isCaptcha">
                  <div vc-recaptcha key="$ctrl.getCaptchaPublicKey()" on-success="$ctrl.setResponse(response)"></div>
                  <span class="recaptcha-error-info" ng-show="smsForm.$submitted && ($ctrl.statusCode != 200 || smsForm.recaptchaResponse.$invalid || smsForm.$error.recaptcha.length)">
                    <span translate="captcha.notselected"></span>
                  </span>
                </md-input-container>
              </div>
            </div>
          </div>
          <div flex="20" flex-sm="10" hide-xs></div>
        </div>
        <div layout="row">
          <div layout="row" layout-align="center" layout-fill>
            <md-button type="submit" class="button-with-icon button-large button-confirm" aria-label="Submit Report">
              <prm-icon icon-type="svg" svg-icon-set="primo-ui" icon-definition="send"></prm-icon>
              <span>{{$ctrl.submitText}}</span>
            </md-button>
          </div>
        </div>
      </form>
    </md-content>
  </div>
  `,
  controller: ['$location', '$httpParamSerializer', '$http', 'csuOptions', 'reportProblemDefault', '$timeout', '$scope', function ($location, $httpParamSerializer, $http, csuOptions, reportProblemDefault, $timeout, $scope) {
    var _this = this;

    this.enabled = csuOptions.hasOwnProperty("reportProblemEnabled") ? csuOptions.reportProblemEnabled : reportProblemDefault.enabled;
    this.requireName = csuOptions.hasOwnProperty("requireName") ? csuOptions.requireName : reportProblemDefault.requireName;
    this.requireEmail = csuOptions.hasOwnProperty("requireEmail") ? csuOptions.requireEmail : reportProblemDefault.requireEmail;
    this.requireDesc = csuOptions.hasOwnProperty("requireDesc") ? csuOptions.requireDesc : reportProblemDefault.requireDesc;
    this.format = csuOptions.hasOwnProperty("format") ? csuOptions.format : reportProblemDefault.format;
    this.messageText = this.messageText || (csuOptions.hasOwnProperty("messageText") ? csuOptions.messageText : reportProblemDefault.messageText);
    this.buttonText = this.buttonText || (csuOptions.hasOwnProperty("buttonText") ? csuOptions.buttonText : reportProblemDefault.buttonText);
    this.submitText = this.submitText || (csuOptions.hasOwnProperty("submitText") ? csuOptions.submitText : reportProblemDefault.submitText);
    this.reportUrl = this.reportUrl || (csuOptions.hasOwnProperty("reportUrl") ? csuOptions.reportUrl : reportProblemDefault.reportUrl);
    this.reportVendor = this.reportVendor || (csuOptions.hasOwnProperty("reportVendor") ? csuOptions.reportVendor : reportProblemDefault.reportVendor);
    this.alertLocation = this.alertLocation || (csuOptions.hasOwnProperty("alertLocation") ? csuOptions.alertLocation : reportProblemDefault.alertLocation);
    this.showLocations = ['/fulldisplay', '/openurl'];
    this.$onInit = function () {
      this.targetUrl = this.reportUrl + $httpParamSerializer($location.search());
      this.show = this.showLocations.includes($location.path()) && this.enabled === true;
      this.name = this.email = this.phoneNumber = this.description = this.gCaptchaResponse = this.statusMessage = '';
      this.telRegEx = /^\d{3}( |-)?\d{3}( |-)?\d{4}$/;
      this.emailRegEx = /^(([^<>()\[\]\\.,;:\s@"]+(\.[^<>()\[\]\\.,;:\s@"]+)*)|(".+"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/; // see http://emailregex.com/
      this.statusCode = 200;
      this.showRPForm = false;
    };
    this.validate = function () {
      return (_this.requireName ? _this.name : true)
        && (_this.requireEmail ? _this.emailRegEx.test(_this.email) : true)
        && (_this.requireDesc ? _this.description : true)
        && (_this.isCaptcha ? _this.gCaptchaResponse : true);
    };
    this.isCaptcha = window.appConfig['system-configuration']['Activate Captcha [Y/N]'] == 'Y';
    this.getCaptchaPublicKey = function () {
      return window.appConfig['system-configuration']['Public Captcha Key'];
    };
    this.setResponse = function (response) {
      return _this.gCaptchaResponse = response;
    };
    this.setStatusCode = function (code) {
      return _this.statusCode = code;
    };
    this.setStatusMessage = function (message) {
      return _this.statusMessage = message;
    };
    this.showReportForm = function () {
      return _this.showRPForm = !_this.showRPForm;
    };
    this.ok = function(){
      $scope.successMessagebool = false;
    }

    this.submitReport = function () {
      if (_this.validate()) {
        var params = {
          'reportVendor': _this.reportVendor,
          'format': _this.format,
          'subject': csuOptions.hasOwnProperty("reportProblemSubject") ? csuOptions.reportProblemSubject : reportProblemDefault.subject,
          'name': _this.name,
          'from': _this.email ? _this.email : (csuOptions.hasOwnProperty("reportProblemFrom") ? csuOptions.reportProblemFrom : reportProblemDefault.from),
          'phone': _this.phoneNumber,
          'description': _this.description,
          'gCaptchaResponse': _this.gCaptchaResponse,
          'urlBase': $location.protocol() + '://' + $location.host() + ($location.port() != 80 ? ':' + $location.port() : '') + '/primo-explore' + $location.path(),
          'urlParams': $location.search(),
          'item': _this.itemCtrl.item
        };
        params.subject = params.subject.replace(/\{(.+?)(?![^}])\}/g, function(match, p1) {
          function recurFind(data, stack) {
            if (data.indexOf('.') > -1) {
              var parts = data.split(/\.(.+)/);
              if (parts[1].indexOf('.') > -1) {
                var parts2 = parts[1].split(/\.(.+)/);
                if (stack.hasOwnProperty(parts[0]))
                  if (stack[parts[0]].hasOwnProperty(parts2[0]))
                    return recurFind(parts2[1], stack[parts[0]][parts2[0]]);
              } else if (stack.hasOwnProperty(parts[0]))
                if (stack[parts[0]].hasOwnProperty(parts[1]))
                  return stack[parts[0]][parts[1]];
            } else if(stack.hasOwnProperty(data))
              return stack[data];
            return false;
          }
          var rft = recurFind(p1, params.item.pnx);
          if(rft) return rft;
          return match;
        });
        if (_this.reportVendor === 'libanswers') {
          params.action = 'libanswers';
          params.instid = csuOptions.hasOwnProperty("instid") ? csuOptions.instid : reportProblemDefault.instid;
          params.quid = csuOptions.hasOwnProperty("quid") ? csuOptions.quid : reportProblemDefault.quid;
          params.qlog = csuOptions.hasOwnProperty("qlog") ? csuOptions.qlog : reportProblemDefault.qlog;
          params.source = csuOptions.hasOwnProperty("source") ? csuOptions.source : reportProblemDefault.source;
        } else if (_this.reportVendor === 'email') {
          params.action = 'problem-email';
          params.to = csuOptions.hasOwnProperty("to") ? csuOptions.to : reportProblemDefault.to;
        }
        $http.post(_this.reportUrl, params).then(function (msg) {
          _this.setStatusCode(msg.status);
          _this.setStatusMessage(msg.statusText);
          $scope.successMessage = "Submitted successfully";
          $scope.successMessagebool = true;
          $scope.successMessagebool = true;
          $timeout(function () {
              $scope.successMessagebool = false;
          }, 8000);
        }).catch(function (err) {
          _this.setStatusCode(err.status);
          _this.setStatusMessage(err.statusText);
          _this.setResponse('');
          if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
          alert('report sending failed');
        }).finally(function () {
          if (_this.statusCode == 200) {
            _this.name = _this.email = _this.phoneNumber = _this.description = _this.gCaptchaResponse = _this.statusMessage = '';
            _this.reportForm.$setPristine();
            _this.reportForm.$setUntouched();
            _this.showReportForm();
          }
        });
      }
    };
  }]
}).run(['$templateCache', 'csuOptions', 'reportProblemDefault', function ($templateCache, csuOptions, reportProblemDefault) {
  if (csuOptions.hasOwnProperty("reportProblemEnabledDefault") ? csuOptions.reportProblemEnabledDefault : reportProblemDefault.enabledDefault) {
    var alertLocation = (csuOptions.hasOwnProperty("alertLocation") ? csuOptions.alertLocation : reportProblemDefault.alertLocation);
    $templateCache.put('components/search/fullView/fullViewServiceContainer/full-view-service-container.html', $templateCache.get('components/search/fullView/fullViewServiceContainer/full-view-service-container.html')
    .replace('</' + alertLocation + '>', '</' + alertLocation + '><oca-report-problem ng-if="$ctrl.index == 1 && $ctrl.service.serviceName===\'activate\'" parent-ctrl="$ctrl"></oca-report-problem>') // get/view it
    .replace('<prm-full-view-service-container-after', '<oca-report-problem ng-if="$ctrl.index == 1 && $ctrl.service.serviceName!==\'activate\'" parent-ctrl="$ctrl"></oca-report-problem><prm-full-view-service-container-after')); // everything else catch-all
  }
}]);

angular.module('reportProblem').value('reportProblemDefault', {
  enabled: false,
  enabledDefault: true,
  requireName: false,
  requireEmail: true,
  requireDesc: true,
  format: 'html', //html | plaintext | markdown
  reportUrl: 'https://library.calstate.edu/primo-gateway/',
  reportVendor: 'email',
  alertLocation: 'prm-login-alma-mashup',
  messageText: 'See something that doesn\'t look right?',
  buttonText: 'Report a Problem',
  submitText: 'Report',
  subject: 'Problem report',
  to: '',
  from: 'donotreply@calstate.edu',
  instid: '',
  quid: '',
  qlog: '',
  source: ''
});
