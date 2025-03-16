// Version 0.2
//  Unterstützt mehrere Abfragearten (immer, per ping, oder basierend auf einem ioBroker-Datenpunkt).
//  Schreibt powerLimit, per command: hoymiles-wifi --host 192.168.1.11 --disable-interactive --power-limit ${newValue} set-power-limit
//
// hoymiles-wifi [-h] --host HOST [--local_addr IP_OF_INTERFACE_TO_USE] [--as-json] <command> [--disable-interactive]
// commands:
//    get-real-data-new,
//    get-real-data,
//    get-config,
//    network-info,
//    app-information-data,
//    app-get-hist-power,
//    set-power-limit,
//    set-wifi,
//    firmware-update,
//    restart-dtu,
//    turn-on-inverter,
//    turn-off-inverter,
//    get-information-data,
//    get-version-info,
//    heartbeat,
//    identify-dtu,
//    identify-inverters,
//    identify-meters,
//    get-alarm-list,
//    enable-performance-data-mode,
//The `--as-json` option is optional and allows formatting the output as JSON.
//The `--disable-interactive` option is optional allows to disable interactive modes (e.g. for setting the power limit).
//For the `set-power-limit` command, you can also use the `--power-limit` parameter to specify the desired power limit. This requires the `--disable-interactive` option to be enabled.


'use strict';

const utils = require('@iobroker/adapter-core'); // Get common adapter utils
const exec = require('child_process').exec;
const { spawn } = require('child_process');

class HoymilesWifi extends utils.Adapter {
    constructor(options) {
        super({
            ...options,
            name: 'hoymiles-wifi',
        });
        this.on('ready', this.onReady.bind(this)); // Wird beim Start des Adapters ausgeführt
        this.on('stateChange', this.onStateChange.bind(this)); // Prüft auf Änderungen, um powerLimit zu schreiben
        this.on('unload', this.onUnload.bind(this)); // Wird bei Beendigung ausgeführt
    }

    async onReady() {
        const host = this.config.host;                                  // Default host if not set
        const interval = parseFloat(this.config.pullInterval) || 60;	// Intervall to pull data
        const debugModeEnabled = this.config.debugModeEnabled || true; 	// log information for analysis

        // Log configuration
        if (this.config.debugModeEnabled) {
            this.log.info(`Host: ${host}, Interval: ${interval}`);
            this.log.info('config pull_option: ' + this.config.pull_option);
            this.log.info('config debugModeEnabled: ' + this.config.debugModeEnabled);
            this.log.info('config Befehlszeile: ' + this.config.Befehlszeile);
            this.log.info('config Option1: ' + this.config.Option1);
            this.log.info('config Option2: ' + this.config.Option2);
            this.log.info('config Option3: ' + this.config.Option3);
            this.log.info('config Option4: ' + this.config.Option4);
            this.log.info('config Option5: ' + this.config.Option5);
	}

	// Initialisiere die Befehlszeilen
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

        this.config.BefehlszeilePowerLimit = this.config.BefehlszeilePowerLimit.replace("$host",host) ||''; // Host ersetzt, aber Option bleibt als Variable um später per Trigger zu setzen.
        this.config.BefehlszeileRestart = this.config.BefehlszeileRestart.replace("$host",host) ||''; // Host ersetzt
        this.config.BefehlszeileInverterOn = this.config.BefehlszeileInverterOn.replace("$host",host) ||''; // Host ersetzt
        this.config.BefehlszeileInverterOff = this.config.BefehlszeileInverterOff.replace("$host",host) ||''; // Host ersetzt

	this.config.Befehlszeile1 = command1;
	this.config.Befehlszeile2 = command2;
	this.config.Befehlszeile3 = command3;
	this.config.Befehlszeile4 = command4;
	this.config.Befehlszeile5 = command5;
	if (this.config.debugModeEnabled) {
           this.log.info('Config of command1: ' + command1);
           this.log.info('Config of command2: ' + command2);
           this.log.info('Config of command3: ' + command3);
           this.log.info('Config of command4: ' + command4);
           this.log.info('Config of command5: ' + command5);
           this.log.info('Config of command PowerLimit: ' + this.config.BefehlszeilePowerLimit);
           this.log.info('Config of command Restart: ' + this.config.BefehlszeileRestart);
           this.log.info('Config of command Inverter-On: ' + this.config.BefehlszeileInverterOn);
           this.log.info('Config of command Inverter-Off: ' + this.config.BefehlszeileInverterOff);
	}

        // Alle eigenen States abonnieren
        await this.subscribeStatesAsync('*');

        await this.setObjectNotExistsAsync('info.connection', { // Statusobjekt für die Verbindung, info.connection
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

        await this.setObjectNotExistsAsync('DtuRestart', { // Button um Neustart auszulösen, Command Option: restart-dtu
            type: 'state',
            common: {
                name: 'DtuRestart',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
                def: false,
            },
            native: {},
        });

//BETA, nur anlegen, wenn Seriennummer vorhanden
        await this.setObjectNotExistsAsync('InverterOn', { // Button um Inverter aktivieren auszulösen, Command Option: turn-on-inverter
            type: 'state',
            common: {
                name: 'InverterOn',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
                def: false,
            },
            native: {},
        });

//BETA, nur anlegen, wenn Seriennummer vorhanden
        await this.setObjectNotExistsAsync('InverterOff', { // Button um Inverter deaktivieren auszulösen, Command Option: turn-off-inverter
            type: 'state',
            common: {
                name: 'InverterOff',
                type: 'boolean',
                role: 'button',
                read: false,
                write: true,
                def: false,
            },
            native: {},
        });


        // Schedule regular data fetching
        this.fetchData();                  // Starte Datenabfrage
        this.scheduleFetch(interval);      // Lege Intervall fest
    }

    /**
     * @param {string} id
     * @param {ioBroker.State | null | undefined} state
     */
    // Änderung an powerLimit abfragen und per "set-power-limit" setzen
    async onStateChange(id, state) {
        if (state && !state.ack) {

            // set-power-limit; Set the power limit of the inverter (0-100%)
            // hoymiles-wifi.0.get_real_data_new.sgsData.0.powerLimit: 999
            //  hoymiles-wifi --host 192.168.1.11 --disable-interactive --power-limit 50,5 set-power-limit
            //
            // Nur nicht bestätigte Änderungen verarbeiten
            if (id.endsWith('powerLimit')) { // Überprüfen, ob es sich um den gewünschten Datenpunkt handelt
                let newValue = state.val;     // 'let' erlaubt eine spätere Zuweisung

                // Prüfen, ob der Wert zwischen 1 und 100 liegt, 0 traue ich mich noch nicht - ggf. wäre HMS nicht mehr erreichbar.
                if (newValue < 2 || newValue > 100) {
                    this.log.warn(`Ungültiger Wert für powerLimit: ${newValue}. Der Wert muss zwischen 2 und 100 (Prozent) liegen.`);
                    return;
                }

                // newValue = newValue;      // Wert umskalieren für HMS, Wert 1-100% (nur Abfrage liefert das Zehnfache)
                // Befehl setzen
                let SetCommand = this.config.BefehlszeilePowerLimit;
                SetCommand = SetCommand.replace("$option", newValue);
                // Bsp für richtig: hoymiles-wifi --host 192.168.1.11 --disable-interactive --power-limit 50 set-power-limit

                if (SetCommand) {
                   try {
                       const result = await this.executeCommand(SetCommand, "");
                   } catch (error) {
                     this.log.error(`Error executing command ${SetCommand}: ${error.message}`);
                   }
                } // if

                if (this.config.debugModeEnabled) {
                   this.log.info(`Setze powerLimit auf ${newValue}%. Befehl: ${SetCommand}`);
                }

            } // if PowerLimit

            // DTU Restart, Gerät wird neu gestartet
            if (id.endsWith('DtuRestart')) { // DtuRestart
                let SetCommand = this.config.BefehlszeileRestart;
                if (SetCommand) {
                   try {
                       const result = await this.executeCommand(SetCommand, "");
                   } catch (error) {
                     this.log.error(`Error executing command ${SetCommand}: ${error.message}`);
                   }
                } // if
                // this.setState('DtuRestart', false, false); // Schalter wieder auf aus setzen. Braucht man das überhaupt?
                if (this.config.debugModeEnabled) {
                   this.log.info(`DtuRestart`);
                }
            } // if DtuRestart

            if (id.endsWith('InverterOn')) { // InverterOn
                if (this.config.debugModeEnabled) {
                    this.log.info(`Switching Inverter On`);
                }
                const serialNumber = await this.getDeviceSerialNumber(); // Ensure it's awaited
                if (serialNumber) {
                    await this.executeSwitchInverter(this.config.BefehlszeileInverterOn, serialNumber);
                } else {
                    this.log.error('Failed to retrieve the inverter serial number.');
                }
                // this.setState('InverterOn', false, false); // Schalter wieder auf aus setzen. Braucht man das überhaupt?
            } // if InverterOn

            if (id.endsWith('InverterOff')) { // InverterOff
                if (this.config.debugModeEnabled) {
                    this.log.info(`Switching Inverter Off`);
                }
                const serialNumber = await this.getDeviceSerialNumber(); // Ensure it's awaited
                if (serialNumber) {
                    await this.executeSwitchInverter(this.config.BefehlszeileInverterOff, serialNumber);
                } else {
                    this.log.error('Failed to retrieve the inverter serial number.');
                }
                // this.setState('InverterOff', false, false); // Schalter wieder auf aus setzen. Braucht man das überhaupt?
            } // if InverterOff

        }
    }  //onStateChange


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
        var skippulling = true;     	// Standarmäßig Abfrage überspringen

          //Version 1.2 Behandlung der neuen pulltypen
	  if (this.config.pull_option === 'pull_type0') {  // Erste Option: immer Abfragen, also auch nachts wenn HMS keine IP-Adresse hat.
             skippulling = false;
          }

          // Püfe Präsenz über Kommandozeilen-Befehl PING
          // Befehl/Programm PING muss per Befehlszeile erreichbar sein, mein Raspberry kann das
          // - sonst nachinstallieren und für user iobroker verfügbar machen
	  if (this.config.pull_option === 'pull_type1') {
              exec(`ping -c 1 ${this.config.host}`, (pingError, pingStdout, pingStderr) => {
                  if (pingError) {
                     if (this.config.debugModeEnabled) {
                         this.log.warn(`Host ${this.config.host} is unreachable: ${pingStderr} per PING by option ${this.config.pull_option}`);
                     }
                     this.setState('info.connection', false, true);
                     skippulling = true;
                     return;
                  }

                  // Host is reachable, proceed with executing the command
                  this.setState('info.connection', true, true);
                  if (this.config.debugModeEnabled) {
                     this.log.info(`Host ${this.config.host} is reachable by command PING by option ${this.config.pull_option}.`);
                  }
                  skippulling = false;
              });
          }

          // PING über den Adapter 'PING' im ioBroker abfragen.
          // Vorteil: wenn Befehl PING nicht verfügbar order zuviel Resourcen zieht.
          if (this.config.pull_option === 'pull_type2') {
              try {
                  const state = await this.getForeignStateAsync(this.config.PingObject);

                  if (!state) {
                      this.log.warn(`Das Objekt ${this.config.PingObject} existiert nicht.`);
                      skippulling = true; // Keine Abfrage, wenn das Objekt nicht existiert
                  } else if (state.val === false) {
                      if (this.config.debugModeEnabled) { 
                         this.log.warn(`Das Objekt ${this.config.PingObject} ist false.`);
                      }
                      skippulling = true; // Keine Abfrage, wenn der Zustand false ist
                  } else {
                      if (this.config.debugModeEnabled) { 
                         this.log.info(`Das Objekt ${this.config.PingObject} ist true.`);
                      }
                      skippulling = false; // Abfrage erlauben
                  }
              } catch (err) {
                  if (this.config.debugModeEnabled) { 
                     this.log.error(`Fehler beim Abfragen des Objekts ${this.config.PingObject}: ${err.message}`);
                  }
                  skippulling = true; // Sicherheitsmaßnahme: keine Abfrage bei Fehler
              }
          }

        if (skippulling) {  // HMS not found, abort pulling / asking device
            if (this.config.debugModeEnabled) {
              this.log.info(`Skip pulling as host ${this.config.host} is not reachable, option ${this.config.pull_option}`);
            }
            this.setState('info.connection', false, true);
            return;         // Beende, wenn Abfrage übersprungen werden soll

        } else {
            for (let i = 1; i <= 5; i++) {
                const command = this.config[`Befehlszeile${i}`];
                const option = this.config[`Option${i}`];
                if (command) {
                    try {
                        const result = await this.executeCommand(command, option);
                        await this.storeData(option, result);
                    } catch (error) {
                        this.log.error(`Error executing command ${command}: ${error.message}`);
                    }
                } // if
            }     //for
        }         // else
    }


    scheduleFetch(interval) {
        this.fetchTimeout = setTimeout(() => {
            this.fetchData();
            this.scheduleFetch(interval);
        }, interval * 1000);
    }


    executeCommand(command, option) {
        if (command === '') {
            return;
        }

        return new Promise((resolve, reject) => {
            // No Skip pulling, directly execute the command
            this.setState('info.connection', true, true);
            if (this.config.debugModeEnabled) {
                this.log.info(`Executing command: ${command}`);
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

                if (option === '') {  // Aufruf über Power-Limit, braucht keine JSON Analyse/Ausgabe
                    return;
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
            });  // exec

        });  // return
    }  // ExecuteCommand

    isValidJson(data) {
        try {
            JSON.parse(data);
            return true;
        } catch {
            return false;
        }
    }

    async getDeviceSerialNumber() { // hole Seriennummer um Inverter an- oder auszuschalten, aus Datenpunkt get_real_data_new.deviceSerialNumber
        try {
            const state = await this.getStateAsync('get_real_data_new.deviceSerialNumber');
            if (state && state.val) {
                if (this.config.debugModeEnabled) {
                   this.log.info(`Serial Number retrieved: ${state.val}`);
                }
                return state.val; // Rückgabe des Werts
            } else {
                this.log.warn('Device Serial Number not found or undefined.');
                return null; // Kein Wert gefunden
            }
        } catch (error) {
            this.log.error(`Error retrieving Serial Number: ${error.message}`);
            return null;
        }
    }

    async executeSwitchInverter(Zeile, Seriennummer) {
        const command = Zeile; // Befehl aus der Konfiguration
        const args = command.split(' '); // Argumente des Befehls
        const child = spawn(args[0], args.slice(1), { stdio: 'pipe' });

        if (!Seriennummer) {
           this.log.warn('Error: Device Serial Number not found or undefined.');
           return;
        }
        // Eingabe der Seriennummer
        // aus welchem Objekt? Aus Maske!!
        child.stdin.write(`${Seriennummer}\n`); // Hier wird die Seriennummer korrekt übergeben
        // Eingabe der Bestätigung
        child.stdin.write('y\n');

        // Ausgabe des Befehls überwachen
        child.stdout.on('data', (data) => {
            if (this.config.debugModeEnabled) {
               this.log.info(`STDOUT: ${data.toString()}`);
            }
        });

        child.stderr.on('data', (data) => {
            this.log.error(`STDERR: ${data.toString()}`);
        });

        child.on('close', (code) => {
            if (this.config.debugModeEnabled) {
                this.log.info(`Switch-Inverter process exited with code ${code}`);
            }
        });

        child.on('error', (error) => {
            this.log.error(`Error while executing turn-on/off-inverter: ${error.message}`);
        });
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

        // power limit of the inverter (0-100%, from 0-1000)
        // value to track and change with: async_set_power_limit(power_limit): Set the power limit of the inverter (0-100%)
        // To be sure not to deactivate inverter and locking out myself, I will limit to 1-100%
        if (name === 'powerLimit') {
           var stateId = `${path}`;				// Objekt beschreibbar machen und auf % ändern
           try {
               await this.setObjectNotExistsAsync(stateId, {
                  type: "state",
                  common: {
                       name: "powerLimit",
                       type: "number",
                       role: "value",
                       unit: "%",
                       min: 2,				// Auf 0 habe ich mich nicht getraut.
                       max: 100,
                       read: true,
                       write: true, 			// false oder true, falls Benutzer den Wert setzen können soll
                       name: "HMS control.powerLimit"
                   },
                   native: {
                       id: "control.powerLimit"
                   },
                });
                if (this.config.debugModeEnabled) {
                   this.log.info(`Objektdefinition für ${stateId} erfolgreich aktualisiert.`);
                }
           } catch (error) {
             this.log.error(`Fehler beim Aktualisieren der Objektdefinition für ${stateId}: ${error.message}`);
           }
           const percentageValue = this.convertToPercentage(value); // Begrenzen auf 0-100%
           // Spezieller Fall: Skaliere von 0-1000 auf 0-100%
           await this.setStateAsync(stateId, { val: percentageValue, ack: true });
           if (this.config.debugModeEnabled) {
              this.log.info(`Key: powerLimit, step8: ${stateId}, Wert(alt): ${value}, Wert(neu): ${percentageValue}`);
              this.log.info(`powerLimit umgerechnet in Prozent: ${percentageValue}%`);
           }
        } else { // Normale Verarbeitung

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
                  type = 'string';
                  role = 'date';
                  value = typeof value === 'number' ? this.convertTimestamp(value) : value;
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
        }  // else ##
    }

    isTimestamp(value) {
        // Check if the number is a reasonable timestamp
        const date = new Date(value * 1000);
        return date.getFullYear() > 2000 && date.getFullYear() < 2100;
    }

    convertTimestamp(value) {
        // Convert the timestamp to a readable date string
        // UNIX-Timestamp zu ISO-Zeit
        const date = new Date(value * 1000);
        return date.toISOString();
    }

    convertToPercentage(value, maxValue = 1000) {
        return Math.min(100, Math.max(1, Math.floor((value / maxValue) * 100)));
    }


}

if (module.parent) {
    module.exports = (options) => new HoymilesWifi(options);
} else {
    new HoymilesWifi();
}
