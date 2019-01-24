angular.module('customActions', []);

/* eslint-disable max-len */
angular.module('customActions').component('customAction', {
  bindings: {
    name: '@',
    label: '@',
    icon: '@',
    iconSet: '@',
    link: '@',
    index: '<'
  },
  require: {
    prmActionCtrl: '^prmActionList'
  },
  controller: ['customActions', function (customActions) {
    var _this = this;

    this.$onInit = function () {
      _this.action = {
        name: _this.name,
        label: _this.label,
        index: _this.index,
        icon: {
          icon: _this.icon,
          iconSet: _this.iconSet,
          type: 'svg'
        },
        onToggle: customActions.processLinkTemplate(_this.link, _this.prmActionCtrl.item)
      };
      customActions.addAction(_this.action, _this.prmActionCtrl);
    };
    this.$onDestroy = function () {
      return customActions.removeAction(_this.action, _this.prmActionCtrl);
    };
  }]
});

/* eslint-disable max-len */
angular.module('customActions').factory('customActions', function () {
  return {
    /**
     * Adds an action to the actions menu, including its icon.
     * @param  {object} action  action object
     * @param  {object} ctrl    instance of prmActionCtrl
     */
    // TODO coerce action.index to be <= requiredActionsList.length
    addAction: function addAction(action, ctrl) {
      if (!this.actionExists(action, ctrl)) {
        this.addActionIcon(action, ctrl);
        ctrl.actionListService.requiredActionsList.splice(action.index, 0, action.name);
        ctrl.actionListService.actionsToIndex[action.name] = action.index;
        ctrl.actionListService.onToggle[action.name] = action.onToggle;
        ctrl.actionListService.actionsToDisplay.unshift(action.name);
      }
    },
    /**
     * Removes an action from the actions menu, including its icon.
     * @param  {object} action  action object
     * @param  {object} ctrl    instance of prmActionCtrl
     */
    removeAction: function removeAction(action, ctrl) {
      if (this.actionExists(action, ctrl)) {
        this.removeActionIcon(action, ctrl);
        delete ctrl.actionListService.actionsToIndex[action.name];
        delete ctrl.actionListService.onToggle[action.name];
        var i = ctrl.actionListService.actionsToDisplay.indexOf(action.name);
        ctrl.actionListService.actionsToDisplay.splice(i, 1);
        i = ctrl.actionListService.requiredActionsList.indexOf(action.name);
        ctrl.actionListService.requiredActionsList.splice(i, 1);
      }
    },
    /**
     * Registers an action's icon.
     * Called internally by addAction().
     * @param  {object} action  action object
     * @param  {object} ctrl    instance of prmActionCtrl
     */
    addActionIcon: function addActionIcon(action, ctrl) {
      ctrl.actionLabelNamesMap[action.name] = action.label;
      ctrl.actionIconNamesMap[action.name] = action.name;
      ctrl.actionIcons[action.name] = action.icon;
    },
    /**
     * Deregisters an action's icon.
     * Called internally by removeAction().
     * @param  {object} action  action object
     * @param  {object} ctrl    instance of prmActionCtrl
     */
    removeActionIcon: function removeActionIcon(action, ctrl) {
      delete ctrl.actionLabelNamesMap[action.name];
      delete ctrl.actionIconNamesMap[action.name];
      delete ctrl.actionIcons[action.name];
    },
    /**
     * Check if an action exists.
     * Returns true if action is part of actionsToIndex.
     * @param  {object} action  action object
     * @param  {object} ctrl    instance of prmActionCtrl
     * @return {bool}
     */
    actionExists: function actionExists(action, ctrl) {
      return ctrl.actionListService.actionsToIndex.hasOwnProperty(action.name);
    },
    /**
     * Process a link into a function to call when the action is clicked.
     * The function will open the processed link in a new tab.
     * Will replace {pnx.xxx.xxx} expressions with properties from the item.
     * @param  {string}    link    the original link string from the html
     * @param  {object}    item    the item object obtained from the controller
     * @return {function}          function to call when the action is clicked
     */
    processLinkTemplate: function processLinkTemplate(link, item) {
      var processedLink = link;
      var pnxProperties = link.match(/\{(pnx\..*?)\}/g) || [];
      pnxProperties.forEach(function (property) {
        var value = property.replace(/[{}]/g, '').split('.').reduce(function (o, i) {
          try {
            var h = /(.*)(\[\d\])/.exec(i);
            if (h instanceof Array) {
              return o[h[1]][h[2].replace(/[^\d]/g, '')];
            }
            return o[i];
          } catch (e) {
            return '';
          }
        }, item);
        processedLink = processedLink.replace(property, value);
      });
      return function () {
        return window.open(processedLink, '_blank');
      };
    }
  };
});

angular.module('sendSms', ['ngMaterial', 'primo-explore.components', 'customActions']);

angular.module('sendSms').component('ocaSendSms', {
  bindings: {
    item: '<',
    finishedSmsEvent: '&'
  },
  template: `
  <div class="send-actions-content-item" layout="row">
    <md-content layout-wrap layout-padding layout-fill>
      <form name="smsForm" novalidate layout="column" layout-align="center center" (submit)="$ctrl.sendSms($event);">
        <div layout="row" class="layout-full-width" layout-align="center center">
          <div flex="20" flex-sm="10" hide-xs></div>
          <div class="form-focus service-form" layout-padding flex>
            <div layout-margin>
              <div layout="column">
                <h4 class="md-subhead">Standard message and data rates may apply.</h4>
                <md-input-container class="underlined-input md-required">
                  <label>Phone number:</label>
                  <input ng-model="$ctrl.phoneNumber" name="phoneNumber" type="text" required ng-pattern="::$ctrl.telRegEx">
                  <div ng-messages="smsForm.phoneNumber.$error">
                    <div ng-message="pattern, required ">phone number is invalid</div>
                  </div>
                </md-input-container>
                <md-input-container class="md-required">
                  <label>Carrier:</label>
                  <md-select ng-model="$ctrl.carrier" name="carrier" placeholder="Select a carrier" required>
                    <md-option ng-repeat="(carrier, address) in $ctrl.carriers" value="{{ address }}">
                      {{ carrier }}
                    </md-option>
                  </md-select>
                  <div ng-messages="smsForm.carrier.$error">
                    <div ng-message="required">please select a carrier</div>
                  </div>
                </md-input-container>
                <md-input-container class="underlined-input" ng-if="$ctrl.isCaptcha">
                  <div vc-recaptcha key="$ctrl.getCaptchaPublicKey()" on-success="$ctrl.setResponse(response)"></div>
                  <span class="recaptcha-error-info" ng-show="smsForm.$submitted && ($ctrl.statusCode != 200 || smsForm.recaptchaResponse.$invalid || smsForm.$error.recaptcha.length)">
                    <span translate="captcha.notselected"></span>
                  </span>
                </md-input-container>
                <md-input-container class="underlined-input" ng-show="$ctrl.statusCode != 200">
                  <span class="recaptcha-error-info" ng-show="$ctrl.statusCode != 200">
                    <span>{{$ctrl.statusMessage}}</span>
                  </span>
                </md-input-container>
              </div>
            </div>
          </div>
          <div flex="20" flex-sm="10" hide-xs></div>
        </div>
        <div layout="row">
          <div layout="row" layout-align="center" layout-fill>
            <md-button type="submit" class="button-with-icon button-large button-confirm" aria-label="Send the result by SMS">
              <prm-icon icon-type="svg" svg-icon-set="primo-ui" icon-definition="send"></prm-icon>
              <span translate="email.popup.link.send"></span>
            </md-button>
          </div>
        </div>
      </form>
    </md-content>
  </div>
  <oca-send-sms-after parent-ctrl="$ctrl"></oca-send-sms-after>
  `,
  controller: ['$http', 'smsCarriers', 'smsCarriersDefault', 'csuOptions', 'smsOptionsDefault', function ($http, smsCarriers, smsCarriersDefault, csuOptions, smsOptionsDefault) {
    var _this = this;

    this.noPrintFoundLabel = csuOptions.hasOwnProperty("noPrintFoundLabel") ? csuOptions.noPrintFoundLabel : smsOptionsDefault.noPrintFoundLabel;
    this.$onInit = function () {
      _this.carriers = angular.equals(smsCarriers, {}) ? smsCarriersDefault : smsCarriers;
      _this.carrier = _this.phoneNumber = _this.gCaptchaResponse = _this.statusMessage = '';
      _this.telRegEx = /^\d{3}( |-)?\d{3}( |-)?\d{4}$/;
      _this.statusCode = 200;
    };
    this.validate = function () {
      return _this.telRegEx.test(_this.phoneNumber) && _this.carrier && (_this.isCaptcha ? _this.gCaptchaResponse : true);
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
    this.sendSms = function () {
      if (_this.validate()) {
        var message = "";
        var title = 'Title: ' + _this.item.pnx.display.title;
        if (_this.item.delivery.holding.length > 0) {
          var holdings = '';
          _this.item.delivery.holding.forEach(function (holding) {
            if (holding.organization == appConfig['primo-view']['institution']['institution-code']) {
              if (holdings != '') holdings += '<br><br>';
              holdings += 'Location: ' + holding.subLocation + '<br>';
              holdings += 'Call Number: ' + holding.callNumber + '<br>';
              holdings += 'Currently ' + holding.availabilityStatus;
            }
          });
          if (holdings == '') {
              holdings = _this.noPrintFoundLabel;
          }
          // make sure we don't exceed 160 (148 chars + stuff)
          if (title.length + holdings.length > 148) {
              title = title.substring(0,148 - holdings.length) + '...';
          }
          message = title + '<br><br>' + holdings;
          console.log("SMS length: " + message.length);
        } else message += _this.noPrintFoundLabel;
        $http.post(csuOptions.formUrl || smsOptionsDefault.formUrl, {
          "action": "sms",
          "from": csuOptions.fromEmail || smsOptionsDefault.fromEmail,
          "to": _this.phoneNumber + '@' + _this.carrier,
          "subject": csuOptions.smsSubject || smsOptionsDefault.subject,
          "message": message,
          "gCaptchaResponse": _this.gCaptchaResponse
        }).then(function (msg) {
          _this.setStatusCode(msg.status);
          _this.setStatusMessage(msg.statusText);
          console.log('sms successfully sent', msg);
        }).catch(function (err) {
          _this.setStatusCode(err.status);
          _this.setStatusMessage(err.statusText);
          _this.setResponse('');
          if (typeof grecaptcha !== 'undefined') grecaptcha.reset();
          console.error('sms sending failed', err);
        }).finally(function () {
          return _this.statusCode == 200 ? _this.finishedSmsEvent() : '';
        });
      }
    };
  }]
}).run(['$templateCache', 'csuOptions', 'smsActionDefault', 'csuOptions', 'smsOptionsDefault', function ($templateCache, csuOptions, smsActionDefault, csuOptions, smsOptionsDefault) {
  if (csuOptions.hasOwnProperty("smsEnabled") ? csuOptions.smsEnabled : smsOptionsDefault.enabled) {
    $templateCache.put('components/search/actions/actionContainer/action-container.html', '<oca-send-sms ng-if="($ctrl.actionName===\'' + (csuOptions.name || smsActionDefault.name) + '\')" finished-sms-event="$ctrl.throwCloseTabsEvent()" item="::$ctrl.item"></oca-send-sms>' + $templateCache.get('components/search/actions/actionContainer/action-container.html'));
    $templateCache.put('components/search/actions/action-list.html', $templateCache.get('components/search/actions/action-list.html').replace('</md-nav-item>', '</md-nav-item><sms-action />'));
  }
}]);

angular.module('sendSms').component('smsAction', {
  require: {
    prmActionCtrl: '^prmActionList'
  },
  controller: ['customActions', 'smsAction', 'smsActionDefault', 'csuOptions', function (customActions, smsAction, smsActionDefault, csuOptions) {
    var _this2 = this;

    smsAction.name = csuOptions.name || smsActionDefault.name;
    smsAction.label = csuOptions.label || smsActionDefault.label;
    smsAction.index = csuOptions.index || smsActionDefault.index;
    smsAction.icon = csuOptions.icon || smsActionDefault.icon;

    this.$onInit = function () {
      return customActions.addAction(smsAction, _this2.prmActionCtrl);
    };
    this.$onDestroy = function () {
      return customActions.removeAction(smsAction, _this2.prmActionCtrl);
    };
  }]
});

angular.module('sendSms').value('smsAction', {}).value('smsActionDefault', {
  name: 'send_sms',
  label: 'Text',
  index: 9,
  icon: {
    icon: 'ic_smartphone_24px',
    iconSet: 'hardware',
    type: 'svg'
  }
}).value('smsCarriers', {}).value('smsCarriersDefault', {
  'ATT': 'sms.att.net',
  'Boost': 'sms.myboostmobile.com',
  'Cricket': 'mms.mycricket.com',
  'Nextel': 'messaging.nextel.com',
  'Project Fi': 'msg.fi.google.com',
  'Qwest': 'qwestmp.com',
  'Sprint': 'messaging.sprintpcs.com',
  'T-Mobile': 'tmomail.net',
  'Verizon': 'vtext.com',
  'Virgin': 'vmobl.com'
}).value('smsOptions', {}).value('smsOptionsDefault', {
  enabled: false,
  formUrl: 'https://library.calstate.edu/primo-gateway/',
  fromEmail: 'do-not-respond@calstate.edu',
  subject: '',
  noPrintFoundLabel: 'No Print Locations'
});
