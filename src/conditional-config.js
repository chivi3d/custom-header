import { hass } from './ha-elements';
import { tabIndexByName } from './helpers';
import { deviceID } from 'card-tools/src/deviceId';
import { lovelace } from 'card-tools/src/hass.js';
import { processTabArray } from './helpers';

export const conditionalConfig = config => {
  const countMatches = conditions => {
    const userVars = {
      user: hass.user.name,
      user_agent: navigator.userAgent,
      device_id: deviceID,
    };
    let count = 0;
    for (const cond in conditions) {
      if (cond == 'user' && conditions[cond].includes(',')) {
        conditions[cond].split(/,+/).forEach(user => {
          if (userVars[cond] == user.trim() || user == hass.user.id) count++;
        });
      } else if (cond == 'tab' && (conditions[cond].includes(',') || conditions[cond].includes('to'))) {
        const tabs = processTabArray(conditions[cond]);
        if (tabs.includes(lovelace().current_view)) {
          count++;
          continue;
        }
      } else if (
        userVars[cond] == conditions[cond] ||
        (cond == 'query_string' && window.location.search.includes(conditions[cond])) ||
        (cond == 'user_agent' && userVars[cond].includes(conditions[cond])) ||
        (cond == 'media_query' && window.matchMedia(conditions[cond]).matches) ||
        (cond == 'user' && conditions[cond] == hass.user.id) ||
        (cond == 'is_admin' && conditions[cond] == hass.user.is_admin) ||
        (cond == 'is_owner' && conditions[cond] == hass.user.is_owner) ||
        (cond == 'template' && conditions[cond]) ||
        (cond == 'tab' && tabIndexByName(conditions[cond]) == lovelace().current_view)
      ) {
        count++;
      } else {
        return 0;
      }
    }
    return count;
  };

  let exceptionConfig = {};
  let highestMatch = 0;
  // Count number of matching conditions and choose config with most matches.
  if (config.exceptions) {
    config.exceptions.forEach(exception => {
      const matches = countMatches(exception.conditions);
      if (matches > highestMatch) {
        highestMatch = matches;
        exceptionConfig = exception.config;
      }
    });
  }

  // If exception config uses hide_tabs and main config uses show_tabs,
  // delete show_tabs and vice versa.
  if (exceptionConfig.hide_tabs && config.show_tabs && exceptionConfig.hide_tabs.length && config.show_tabs.length) {
    delete config.show_tabs;
  } else if (
    exceptionConfig.show_tabs &&
    config.hide_tabs &&
    exceptionConfig.show_tabs.length &&
    config.hide_tabs.length
  ) {
    delete config.hide_tabs;
  }
  window.customHeaderExceptionConfig = JSON.stringify(exceptionConfig);
  return { ...config, ...exceptionConfig };
};
