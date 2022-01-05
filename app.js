return {
    node_name: '',
    manifest: {
        timers: ['exit', 'second']
    },
    persist: {
        version: 1,
        data: ['menu_structure']
    },
    config: {},

    menu_structure: {
        "label": "Main screen",
        "is_submenu": true,
        "close_app_on_finish": true,
        "action_handlers": {
          "top_short_press_release": {
            "label": "Smarthome",
            "is_submenu": true,
            "action_handlers": {
              "top_short_press_release": {
                "label": "Open window",
                "data_sent_on_action": "window_open",
                "message_displayed_on_action": "opening window..."
              },
              "top_hold": {
                "label": "Close window",
                "data_sent_on_action": "window_close",
                "message_displayed_on_action": "closing window..."
              },
              "middle_short_press_release": {
                "label": "Toggle light",
                "data_sent_on_action": "Licht umschalten",
                "message_displayed_on_action": "toggling light..."
              },
              "bottom_short_press_release": {
                "label": "Back",
                "action_goes_back": true
              }
            }
          },
          "top_hold": {
              "label": "Coffee"
          },
          "bottom_short_press_release": {
            "label": "Quit",
            "action_closes_app": true
          }
        }
      },

    message_to_display: '',

    handler: function (event, response) {
        this.wrap_event(event)
        this.wrap_response(response)
        this.state_machine.handle_event(event, response)
    },
    log: function (object) {
        req_data(this.node_name, '"type": "log", "data":' + JSON.stringify(object), 999999, true)
    },
    draw_menu: function (response) {
        var handlers = this.current_action.action_handlers

        var layout_data = {
            json_file: 'menu_layout',
            menu_title: this.current_action.label,
            message_to_display: this.message_to_display
        }

        var button_types = ['top', 'middle', 'bottom']

        button_types.forEach(function(button_type){
            var short_handler = handlers[button_type + '_short_press_release']
            if(short_handler != null){
                layout_data[button_type + '_short_press_label'] = short_handler.label
            }
            
            var long_handler = handlers[button_type + '_hold']
            if(long_handler != null){
                layout_data[button_type + '_long_press_label'] = long_handler.label
            }
        })
        
        response.draw_screen(
            this.node_name,
            true,
            layout_data
        )
    },
    wrap_state_machine: function(state_machine) {
        state_machine.set_current_state = state_machine.d
        state_machine.handle_event = state_machine._
        state_machine.get_current_state = function(){
            return state_machine.n
        }

        return state_machine
    },
    wrap_event: function (system_state_update_event) {
        if (system_state_update_event.type === 'system_state_update') {
            system_state_update_event.concerns_this_app = system_state_update_event.de
            system_state_update_event.old_state = system_state_update_event.ze
            system_state_update_event.new_state = system_state_update_event.le
        }
        return system_state_update_event
    },
    wrap_response: function (response) {
        response.move_hands = function (degrees_hour, degrees_minute, relative) {
            response.move = {
                h: degrees_hour,
                m: degrees_minute,
                is_relative: relative
            }
        }
        response.vibrate_pattern = function(type){
            response.vibe = type
        }
        response.vibrate_text_pattern = function(){
            this.vibrate_pattern('text')
        }
        response.vibrate_call_pattern = function(){
            this.vibrate_pattern('call')
        }
        response.go_back = function (kill_app) {
            response.action = {
                type: 'go_back',
                Se: kill_app
            }
        }
        response.go_home = function (kill_app) {
            response.action = {
                type: 'go_home',
                Se: kill_app
            }
        }
        response.draw_screen = function (node_name, full_update, layout_info) {
            response.draw = {
                update_type: full_update ? 'du4' : 'gu4'
            }
            response.draw[node_name] = {
                layout_function: 'layout_parser_json',
                layout_info: layout_info
            }
        }
        response.send_user_class_event = function (event_type) {
            response.send_generic_event({
                type: event_type,
                class: 'user'
            })
        }
        response.send_generic_event = function (event_object) {
            if (response.i == undefined) response.i = []
            response.i.push(event_object)
        }
        return response
    },
    handle_global_event: function (self, state_machine, event, response) {
        self.log("event type: " + event.type)
        self.log(event)

        if (event.type === 'system_state_update' && event.concerns_this_app === true && event.new_state === 'visible') {
            state_machine.d('menu')
        } 
    },
    handle_menu_event: function(event, response){
        var handler = null
        if(event == null){
            handler = this.current_action
        }else{
            var event_type = event.type
            var handlers = this.current_action.action_handlers
            handler = handlers[event_type]
        }

        if(handler == null){
            return
        }

        var data = handler.data_sent_on_action
        if(data != null){
            req_data(this.node_name, '"commuteApp._.config.commute_info":{"dest":"' + data + '","action":"start"}', 999999, true)
        }
        var message = handler.message_displayed_on_action
        if(message != null){
            this.message_to_display = message
            this.draw_menu(response)
        }
        if(handler.is_submenu){
            handler.previous_action = this.current_action
            this.current_action = handler
            this.draw_menu(response)
        }
        if(handler.action_goes_back){
            var previous = this.current_action.previous_action
            if(previous == null){
                response.go_back(true)
            }else{
                this.current_action = previous
                this.draw_menu(response)
            }
        }
        if(handler.action_closes_app){
            response.go_back(true)
        }
    },
    handle_config_update: function(response){
        if(this.config.response != null){
            var is_finished = this.config.response.is_finished
            if(is_finished){
                response.vibrate_text_pattern()
                if(this.current_action.close_app_on_finish){
                    response.go_back(true)
                    return
                }
            }
            this.message_to_display = this.config.response.message
            this.config.response = null
            this.draw_menu(response)
        }
        if(this.config.menu_structure != null){
            this.menu_structure = this.config.menu_structure
            this.config.menu_structure = null
            this.current_action = this.menu_structure
            save_node_persist(this.node_name)
            this.draw_menu(response)
        }
    },
    handle_state_specific_event: function (state, state_phase) {
        switch (state) {
            case 'background': {
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {

                    }
                }
                break;
            }
            case 'menu': {
                if (state_phase == 'entry') {
                    return function (self, response) {
                        response.move_hands(200, 200, false)
                        self.handle_menu_event(null, response)
                    }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                        if(event.type == 'node_config_update'){
                            if(event.node_name == self.node_name){
                                self.handle_config_update(response)
                            }
                        }
                        self.handle_menu_event(event, response)
                    }
                }
                if (state_phase == 'exit') {
                    return function (arg, arg2) { // function 14, 20

                    }
                }
                break;
            }
        }
        return
    },
    init: function () { // function 8
        this.current_action = this.menu_structure
        this.state_machine = new state_machine(
            this,
            this.handle_global_event,
            this.handle_state_specific_event,
            undefined,
            'background'
        )
        this.wrap_state_machine(this.state_machine)
    }
}
















