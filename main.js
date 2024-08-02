'use strict';

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const exec = require('child_process').exec;

class HoymilesWifi extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: 'hoymiles-wifi',
        });
        this.on('ready', this.onReady.bind(this));
        this.on('unload', this.onUnload.bind(this));
    }

    async onReady() {
        const host = this.config.host; // Default host if not set
        const interval = parseFloat(this.config.pollInterval) || 60;	// Intervall to poll data
        const skipPolling = this.config.skipPolling || true; 		// Skip polling when night time (HMS is not reachable)
        const debugModeEnabled = this.config.debugModeEnabled || true; 		// log information for analysis

	if (this.config.debugModeEnabled) {
	        this.log.info('config host: ' + this.config.host);
        	this.log.info('config pollInterval: ' + this.config.pollInterval);
	        this.log.info('config skipPolling: ' + this.config.skipPolling);
        	this.log.info('config debugModeEnabled: ' + this.config.debugModeEnabled);
        	this.log.info('config Befehlszeile: ' + this.config.Befehlszeile);
	        this.log.info('config Option1: ' + this.config.Option1);
        	this.log.info('config Option2: ' + this.config.Option2);
	        this.log.info('config Option3: ' + this.config.Option3);
        	this.log.info('config Option4: ' + this.config.Option4);
	        this.log.info('config Option5: ' + this.config.Option5);
	}

	// Aufbau der Befehlszeilen
	let command1 = '';
	let command2 = '';
	let command3 = '';
	let command4 = '';
	let command5 = '';
	let command0 = this.config.Befehlszeile.replace("$host",host) ||'';
	if (this.config.Option1 != '') { command1 = command0.replace("$option", this.config.Option1); } 
	if (this.config.Option2 != '') { command2 = command0.replace("$option", this.config.Option2); } 
	if (this.config.Option3 != '') { command3 = command0.replace("$option", this.config.Option3); } 
	if (this.config.Option4 != '') { command4 = command0.replace("$option", this.config.Option4); } 
	if (this.config.Option5 != '') { command5 = command0.replace("$option", this.config.Option5); } 

	if (this.config.debugModeEnabled) {
	        this.log.info('Config of command1: ' + command1);
        	this.log.info('Config of command2: ' + command2);
	        this.log.info('Config of command3: ' + command3);
        	this.log.info('Config of command4: ' + command4);
	        this.log.info('Config of command5: ' + command5);
	}
	this.config.Befehlszeile1 = command1;
	this.config.Befehlszeile2 = command2;
	this.config.Befehlszeile3 = command3;
	this.config.Befehlszeile4 = command4;
	this.config.Befehlszeile5 = command5;

        // Define the state info.connection
        await this.setObjectNotExistsAsync('info.connection', {
            type: 'state',
            common: {
                name: 'Connection',
                type: 'boolean',
                role: 'indicator.connected',
                read: true,
                write: false,
                def: false,
            },
            native: {},
        });

        // Schedule regular data fetching
        this.fetchData();
        this.scheduleFetch();
    }

    onUnload(callback) {
        try {
            clearTimeout(this.fetchTimeout);
            callback();
        } catch (e) {
            callback();
        }
    }

    async fetchData() {
        const host = this.config.host;
//        const commands = [
//            'get-real-data-new',
//            'get-real-data',
//            'get-config',
//            'network-info',
//            'app-information-data',
//            'app-get-hist-power',
//            'get-information-data',
//            'get-version-info',
//            'heartbeat',
//            'get-alarm-list'
//        ];


	  if (this.config.Befehlszeile1 != '') {
            try {
                const result = await this.executeCommand(this.config.Befehlszeile1, this.config.Option1);
                await this.storeData(this.config.Option1, result);
            } catch (error) {
                this.log.debug(`Error executing command ${this.config.Befehlszeile1}: ${error.message}`);
            }
	  }
	  if (this.config.Befehlszeile2 != '') {
            try {
                const result = await this.executeCommand(this.config.Befehlszeile2, this.config.Option2);
                await this.storeData(this.config.Option2, result);
            } catch (error) {
                this.log.debug(`Error executing command ${this.config.Befehlszeile2}: ${error.message}`);
            }
	  }
	  if (this.config.Befehlszeile3 != '') {
            try {
                const result = await this.executeCommand(this.config.Befehlszeile3, this.config.Option3);
                await this.storeData(this.config.Option3, result);
            } catch (error) {
                this.log.debug(`Error executing command ${this.config.Befehlszeile3}: ${error.message}`);
            }
	  }
	  if (this.config.Befehlszeile4 != '') {
            try {
                const result = await this.executeCommand(this.config.Befehlszeile4, this.config.Option4);
                await this.storeData(this.config.Option4, result);
            } catch (error) {
                this.log.debug(`Error executing command ${this.config.Befehlszeile4}: ${error.message}`);
            }
	  }
	  if (this.config.Befehlszeile5 != '') {
            try {
                const result = await this.executeCommand(this.config.Befehlszeile5, this.config.Option5);
                await this.storeData(this.config.Option5, result);
            } catch (error) {
                this.log.debug(`Error executing command ${this.config.Befehlszeile5}: ${error.message}`);
            }
	  }

    }

    scheduleFetch() {
        const interval = parseFloat(this.config.pollInterval) || 60;
        this.fetchTimeout = setTimeout(() => {
            this.fetchData();
            this.scheduleFetch();
        }, interval * 1000);
    }

    executeCommand(command, option) {
        if (command === '') {
            return;
        }

        return new Promise((resolve, reject) => {
            if (this.config.skipPolling) {
                // Ping host before executing the command
                exec(`ping -c 1 ${this.config.host}`, (pingError, pingStdout, pingStderr) => {
                    if (pingError) {
                        if (this.config.debugModeEnabled) {
                            this.log.warn(`Host ${this.config.host} is not reachable: ${pingStderr}`);
                        }
                        this.setState('info.connection', false, true);
                        return reject(new Error(`Host ${this.config.host} is not reachable`));
                    }

                    // Host is reachable, proceed with executing the command
                    this.setState('info.connection', true, true);
                    if (this.config.debugModeEnabled) {
                        this.log.info(`Host ${this.config.host} is reachable. Executing command: ${command}`);
                    }

                    // Execute the command
                    exec(command, (error, stdout, stderr) => {
                        if (error) {
                            if (this.config.debugModeEnabled) {
                                this.log.error(`Error executing command: ${command}`);
                                this.log.error(`stderr: ${stderr}`);
                            }
                            return reject(error);
                        }

                        if (this.config.debugModeEnabled) {
                            this.log.info(`Command stdout: ${stdout}`);
                        }

                        if (!this.isValidJson(stdout)) {
                            if (this.config.debugModeEnabled) {
                                this.log.error(`Invalid JSON response for command: ${command}`);
                                this.log.error(`Response: ${stdout}`);
                            }
                            return reject(new Error(`${command}: Invalid JSON response`));
                        }

                        try {
                            const data = JSON.parse(stdout);
                            resolve(data);
                        } catch (parseError) {
                            if (this.config.debugModeEnabled) {
                                this.log.error(`Error parsing JSON response for command: ${command}`);
                                this.log.error(`Response: ${stdout}`);
                            }
                            reject(parseError);
                        }
                    });
                });
            } else {
                // Skip polling is disabled, directly execute the command
                this.setState('info.connection', true, true);
                if (this.config.debugModeEnabled) {
                    this.log.info(`Executing command without ping check: ${command}`);
                }

                exec(command, (error, stdout, stderr) => {
                    if (error) {
                        if (this.config.debugModeEnabled) {
                            this.log.error(`Error executing command: ${command}`);
                            this.log.error(`stderr: ${stderr}`);
                        }
                        return reject(error);
                    }

                    if (this.config.debugModeEnabled) {
                        this.log.info(`Command stdout: ${stdout}`);
                    }

                    if (!this.isValidJson(stdout)) {
                        if (this.config.debugModeEnabled) {
                            this.log.error(`Invalid JSON response for command: ${command}`);
                            this.log.error(`Response: ${stdout}`);
                        }
                        return reject(new Error(`${command}: Invalid JSON response`));
                    }

                    try {
                        const data = JSON.parse(stdout);
                        resolve(data);
                    } catch (parseError) {
                        if (this.config.debugModeEnabled) {
                            this.log.error(`Error parsing JSON response for command: ${command}`);
                            this.log.error(`Response: ${stdout}`);
                        }
                        reject(parseError);
                    }
                });
            }
        });
    }  // ExecuteCommand

    isValidJson(data) {
        try {
            JSON.parse(data);
            return true;
        } catch {
            return false;
        }
    }

    async storeData(option, data) {
        const statePath = `${this.namespace}.${option.replace(/-/g, '_')}`;
        try {
            // Check if the main data is an object and process it
            if (typeof data === 'object' && data !== null) {
                for (const [key, value] of Object.entries(data)) {
                    await this.processData(`${statePath}.${key}`, key, value);
                }
            } else {
                await this.processData(statePath, option, data);
            }
        } catch (error) {
            this.log.error(`Error storing data for option ${option}: ${error.message}`);
        }
    }

    async processData(path, name, value) {
        if (Array.isArray(value)) {
            // Create a folder for the array
            await this.setObjectNotExistsAsync(path, {
                type: 'channel',
                common: {
                    name: name,
                },
                native: {},
            });
            // Process each element of the array
            for (let i = 0; i < value.length; i++) {
                await this.processData(`${path}.${i}`, `${name}[${i}]`, value[i]);
            }
        } else if (typeof value === 'object' && value !== null) {
            // Create a folder for the object
            await this.setObjectNotExistsAsync(path, {
                type: 'channel',
                common: {
                    name: name,
                },
                native: {},
            });
            // Process each property of the object
            for (const [key, subValue] of Object.entries(value)) {
                await this.processData(`${path}.${key}`, key, subValue);
            }
        } else {
            // Create and store the state
            let type = typeof value;
            let role = 'value';

            // Check if the value is a timestamp
            if (type === 'number' && this.isTimestamp(value)) {
                value = this.convertTimestamp(value);
                type = 'string';
                role = 'date';
            }

            await this.setObjectNotExistsAsync(path, {
                type: 'state',
                common: {
                    name: name,
                    type: type,
                    role: role,
                    read: true,
                    write: false,
                },
                native: {},
            });
            await this.setStateAsync(path, { val: value, ack: true });
        }
    }

    isTimestamp(value) {
        // Check if the number is a reasonable timestamp
        const date = new Date(value * 1000);
        return date.getFullYear() > 2000 && date.getFullYear() < 2100;
    }

    convertTimestamp(value) {
        // Convert the timestamp to a readable date string
        const date = new Date(value * 1000);
        return date.toISOString();
    }
}

if (module.parent) {
    module.exports = (options) => new HoymilesWifi(options);
} else {
    new HoymilesWifi();
}


