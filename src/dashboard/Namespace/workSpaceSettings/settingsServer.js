const { fetchSingleWorkSpaceSS } = require('../../../utilities');


/**
 * 
 * @param {Object} options 
 */

function updateSettingsChangeSS(options) {
    // Fetched Temproray Changes Setting Array 
    // try {

        let settingObj = fetchChangedSettings();

        const nsDetails = fetchSingleWorkSpaceSS(options.nsEndPoint);

        
        // Initializing the custom roles array to the settingObj [allRoles]
        const allRoles = nsDetails.roles.custom.map(role => {
            return role.roleTag
        })

        // Array to Object Function [Special]
        function arrToObj(arr) {
            let obj = {};

            for(let i = 0; i < arr.length; i++) {
                // Converting to array, which having empty array {members: []}
                obj[arr[i]] = {members: []};
            }

            return obj;
        }

        if(!settingObj) {
            // Setting Count
            window.settingCount = 0;

            settingObj = {
                nsEndPoint: options.nsEndPoint,
                title: options.title || undefined,
                image: options.image || undefined,
                roles: {
                    custom: arrToObj(allRoles)
                }
            }
        }

        // Counting Changes
        if(options.method === 'adding') {
            settingCount++;
        } else if(options.method === 'removing') {
            settingCount--;
        }

        // This is utility function for ....
        // if the property is manually passed 'undefined' for deleting the property
        function saveDetails(prop) {
            let res = undefined;
            let condition = !prop.permission === true ? options[prop.key] !== undefined : options[prop.key] === true || options[prop.key] === false || options[prop.key] == 'undefined' ;
            console.log(condition);
            if(condition) {
                res = options[prop.key]

                if(options[prop.key] == 'undefined') {
                    res = undefined;
                }
            } else if(prop.obj) {
                res = prop.obj;
            }

            return res;
        }

        settingObj.roles.custom[options.roleTag] = {
            name: saveDetails({
                key: 'name',
                obj: settingObj.roles.custom[options.roleTag].name
            }),
            priority: saveDetails({
                key: 'priority',
                obj: settingObj.roles.custom[options.roleTag].priority
            }),
            color: saveDetails({
                key: 'color',
                obj: settingObj.roles.custom[options.roleTag].color
            }),
            members: settingObj.roles.custom[options.roleTag].members,
            permissions: settingObj.roles.custom[options.roleTag].permissions || {}
        }

        // Adding Member to role
        if(options.category && options.category === 'role_member') {
            settingObj.roles.custom[options.roleTag].members.push({
                action: options.action || undefined,
                userId: options.userId || undefined
            })
        }

        // Toggling Permissions
        if(options.category && options.category === 'permission_toggle') {
            settingObj.roles.custom[options.roleTag].permissions[options.permission] = saveDetails({
                key: 'value',
                obj: settingObj.roles.custom[options.roleTag].permissions[options.permission],
                permission: true
            });
        }

        // Saving changed data to SessionStorage
        sessionStorage.setItem('settingsToBeSaved', JSON.stringify(settingObj));
        
        console.log(settingCount);

        window.saveModal = document.querySelector('.save_modal');
        if(settingCount > 0) {
            saveModal.classList.add('savePopup');
        } else {
            saveModal.classList.remove('savePopup');
        }

    // } catch (e) {
    //     console.log(e.message);
    // }
}

/**
 * 
 * @returns {Array}
 */

function fetchChangedSettings() {
    // Checking If SessionStorage is already initialized
    let jsonData = sessionStorage.getItem('settingsToBeSaved');
    if(!jsonData) {
        return false;
    }

    // JSON Data is actually an Array
    // Parsing JSON Data
    return JSON.parse(jsonData);
}

// Resetting Changes withouting being saved to the database
function resetSettingsChanges() {
    // Fetching settings before its being removed
    const settings = fetchChangedSettings();
    console.log(settings);

    // Removing temp settings
    sessionStorage.removeItem('settingsToBeSaved');

    // Checking which setting is open
    const activeNavItem = document.querySelector('.overview_section > .list > .settings_nav_item.active');
    const curSettingUI = activeNavItem.dataset.navsetting;
    
    if(curSettingUI === 'roles') {
        // Getting current loaded role
        const { getCurrentLoadedRole, show_role_settings } = require('./SettingsHandle/Roles/Client/roleUI');
        const activeRoleTag = getCurrentLoadedRole();

        // Loading role with resetted settings
        show_role_settings(activeRoleTag, settings.nsEndPoint);
    }
}


/**
 * 
 * @returns {async Object}
 */

// Saving Settings to workspace
async function postSaveSettings() {
    const settingObj = fetchChangedSettings();

    const res = await fetch(`${window.location.origin}/workspace/settings?save=true`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({
            settingObj: settingObj
        })
    })

    return await res.json();
}


module.exports = {
    fetchChangedSettings,
    updateSettingsChangeSS,
    postSaveSettings,
    resetSettingsChanges
}