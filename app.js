return {
    node_name: '',
    manifest: {
        timers: ['update_partial', 'update_full', 'hands', 'flick_away']
    },
    persist: {
        version: 1,
        data: ['menu_structure']
    },
    config: {},

    // watch stuff
    complications: {
        draw: {}
    },
    installed_complications: [],
    timeout_partial_display_update: 15 * 60 * 1000,
    timeout_full_display_update: 60 * 60 * 1000,
    full_refresh_needed: false,
    powersave_display: false,
    powersave_hands: false,
    time_telling_enabled: true,
    wrist_flick_display_timeout: 5000,
    wrist_flick_hands_timeout: 2200,
    wrist_flick_hands_relative: true,
    wrist_flick_move_hour: 360,
    wrist_flick_move_minute: -360,
    // end watch stuff

    menu_structure: {
        "label": "Main screen",
        "is_submenu": true,
        "message_displayed_on_action": "Bit empty, huh?",
        "action_handlers": [
          {
            "action": "top_short_press_release",
            "label": "Short Press",
            "message_displayed_on_action": "that was a top short press"
          },
          {
            "action": "top_hold",
            "label": "Long Press",
            "message_displayed_on_action": "that was a top long press"
          },
          {
            "action": "middle_short_press_release",
            "label": "Reset",
            "message_displayed_on_action": ""
          },
          {
            "action": "bottom_short_press_release",
            "label": "Short Press",
            "message_displayed_on_action": "that was a bottom short press"
          },
          {
            "action": "bottom_hold",
            "label": "Long Press",
            "message_displayed_on_action": "that was a bottom long press"
          }
        ]
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
        var layout_data = {
            json_file: 'menu_layout',
            menu_title: this.current_action.label,
            message_to_display: this.message_to_display,
        }
        if(this.state_machine.get_current_state() == 'menu'){
            layout_data['middle_long_press_label'] = 'quit'
        }

        var button_types = ['top', 'middle', 'bottom']


        var handlers = this.current_action.action_handlers
        if(handlers != null){
            button_types.forEach(function(button_type){
                var key = button_type + '_short_press_release'
                handlers.forEach(function(handler){
                    if(handler.action == key){
                        layout_data[button_type + '_short_press_label'] = handler.label
                        return
                    }
                })

                if(button_type == 'middle'){
                    return
                }
            
                key = button_type + '_hold'
                handlers.forEach(function(handler){
                    if(handler.action == key){
                        layout_data[button_type + '_long_press_label'] = handler.label
                        return
                    }
                })
            })
        }
        
        response.draw_screen(
            this.node_name,
            true,
            layout_data
        )
    },
    draw_watch: function(response) {
        response.draw = {
            node_name: this.node_name,
            package_name: this.package_name,
            layout_function: 'layout_parser_json',
            background: undefined,
            array: [],
            update_type: this.full_refresh_needed ? 'gc4' : 'du4',
            skip_invert: true,
        };
        this.full_refresh_needed = false;
        var counter = 0;
        for (var key in this.config.layout) {
            var layout = this.config.layout[key];
            if ((layout === undefined) || (is_empty_string(layout.name))) {
                continue;
            }
            if (layout.type === 'image') {
                if ((layout.size.w == 240) && (layout.size.h == 240)) {
                    response.draw.background = layout.name;
                }
            }
            if (layout.type === 'comp') {
                if (typeof(this.complications.draw[layout.name]) !== 'object' ) {
                    continue;
                }
                response.draw.array[counter] = {
                    size: layout.size,
                    pos: layout.pos,
                    background: layout.bg,
                    $e: layout.color == 'black',
                };
                deep_fill(response.draw.array[counter], this.complications.draw[layout.name]);
                counter++;
            }
        }
        this.draw_menu(response)
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
        response.open_app = function(appName){
            response.action = {
                type: 'open_app',
                node_name: appName,
                class: 'watch_app',
            }
        }
        return response
    },
    handle_global_event: function (self, state_machine, event, response) {
        // self.log("event type: " + event.type)
        // self.log(event)


        if(event.type == 'node_config_update'){
            if(event.node_name == self.node_name){
                self.handle_config_update(response)
            }
        }

        if (event.type === 'system_state_update' && event.concerns_this_app === true && event.new_state === 'visible') {
            state_machine.set_current_state('watch')
        } 
    },
    execute_handler: function(handler, response, force_draw){
        var data = handler.data_sent_on_action
        if(data != null){
            req_data(this.node_name, '"commuteApp._.config.commute_info":{"dest":"' + data + '","action":"start"}', 999999, true)
        }
        var message = handler.message_displayed_on_action
        var draw_menu = true
        if(message != null){
            this.message_to_display = message
            draw_menu = true
        }
        if(handler.is_submenu){
            handler.previous_action = this.current_action
            this.current_action = handler
            draw_menu = true
            this.state_machine.set_current_state('menu')
        }
        if(handler.action_goes_back){
            var previous = this.current_action.previous_action
            if(previous == null){
                self.state_machine.set_current_state('watch')
            }else{
                this.current_action = previous
                draw_menu = true
            }
        }
        if(handler.app_to_open != null){
            response.open_app(handler.app_to_open)
        }
        if(handler.action_closes_app){
            self.state_machine.set_current_state('watch')
        }else if(draw_menu){
            this.draw_menu(response)
        }
    },
    handle_menu_event: function(event, response){
        var event_type = event.type
        var handlers = this.current_action.action_handlers
        if(handlers == null){
            return
        }
        var self = this
        handlers.forEach(function(handler){
            if(handler.action == event_type){
                self.execute_handler(handler, response)
            }
        })
        
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
            if(this.state_machine.get_current_state() == 'menu'){
                this.state_machine.set_current_state('watch')
            }else if(this.state_machine.get_current_state() == 'watch'){
                this.draw_menu(response)
            }
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
                    }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {
                        if(event.type == 'middle_hold'){
                            self.state_machine.set_current_state('watch')
                            return
                        }
                        self.handle_menu_event(event, response)
                    }
                }
                if (state_phase == 'exit') {
                    return function (self, response) {
                        self.current_action = self.menu_structure
                    }
                }
                break;
            }
            case 'watch': {
                if (state_phase == 'entry') {
                    return function (self, response) {
                        self.update_complications({
                            type: 'watch_face_update',
                            reason: 'watch_face_visible',
                        });
                        self.full_refresh_needed = true;
                        self.draw_watch(response);
                        var hands = enable_time_telling();
                        response.move_hands(hands.hour_pos,  hands.minute_pos, false)
                        self.time_telling_enabled = true
                        start_timer(self.node_name, 'update_partial', this.timeout_partial_display_update);
                        start_timer(self.node_name, 'update_full', this.timeout_full_display_update);
                    }
                }
                if (state_phase == 'during') {
                    return function (self, state_machine, event, response) {

                        var redraw_needed = false

                        if(event.type == 'top_short_press_release'){
                            response.vibrate_text_pattern()
                            response.action = {
                                type: 'open_app',
                                node_name: 'stopwatchApp',
                                class: 'watch_app',
                            }
                            return
                        }

                        if(event.type == 'middle_hold'){
                            // response.go_back(true)
                            // return
                        }else if ((event.type == 'time_telling_update') && ((!self.powersave_hands) || (!get_common().device_offwrist))) {
                            // Called every 20 seconds, i.e. every time the hands need to move
                            var hands = enable_time_telling()
                            response.move_hands(hands.hour_pos, hands.minute_pos, false)
                        }else if ((event.type == 'common_update') && (event.device_offwrist)) {
                            if (get_common().device_offwrist) {
                                disable_time_telling();
                                self.time_telling_enabled = false;
                            } else {
                                var hands = enable_time_telling();
                                response.move_hands(hands.hour_pos,  hands.minute_pos, false)
                                self.time_telling_enabled = true;
                            }
                        } else if(event.type == 'timer_expired'){
                            if (is_this_timer_expired(event, self.node_name, 'hands')) {
                                // Timer for reenabling time telling after wrist flick expired
                                var hands = enable_time_telling();
                                response.move = {
                                    h: hands.hour_pos,
                                    m: hands.minute_pos,
                                    is_relative: false,
                                };
                                self.time_telling_enabled = true;
                            }
                            if(!self.powersave_display && !get_common().device_offwrist){
                                if (is_this_timer_expired(event, self.node_name, 'update_partial')) {
                                    // Timer for partial display updates expired
                                    redraw_needed = self.update_complications({
                                        type: 'display_data_updated',
                                    });
                                    start_timer(self.node_name, 'update_partial', self.timeout_partial_display_update);
                                }
                                if (is_this_timer_expired(event, self.node_name, 'update_full')) {
                                    // Timer for full display updates expired
                                    redraw_needed = true;
                                    self.update_complications({
                                        type: 'display_data_updated',
                                    });
                                    self.full_refresh_needed = true;
                                    start_timer(self.node_name, 'update_full', self.timeout_full_display_update);
                                }
                            }
                        } else if (event.type == 'flick_away') {
                            // Called when the user flicks the wrist
                            self.update_complications({
                                type: 'display_data_updated',
                                reason: 'flick_away',
                            });
                            //redraw_needed = true;
                            start_timer(self.node_name, 'update_partial', self.timeout_partial_display_update);
                            start_timer(self.node_name, 'flick_away', self.wrist_flick_display_timeout);
                            if (self.time_telling_enabled) {
                                disable_time_telling();
                                self.time_telling_enabled = false;
                            }
                            start_timer(self.node_name, 'hands', self.wrist_flick_hands_timeout);
                            response.move = {
                                h: self.wrist_flick_move_hour,
                                m: self.wrist_flick_move_minute,
                                is_relative: self.wrist_flick_hands_relative,
                            };
                        }else if (((event.type === 'display_data_updated') || (self.update_complications(event))) && ((!self.powersave_display) || (!get_common().device_offwrist))) {
                            // Something on the display needs to be updated
                            redraw_needed = true;
                        }
                        if (redraw_needed) {
                            self.draw_watch(response);
                        }
                        self.handle_menu_event(event, response)
                    }
                }
                if (state_phase == 'exit') {
                    return function (self, response) {
                        disable_time_telling()
                        self.time_telling_enabled = false
                        stop_timer(self.node_name, 'update_partial')
                        stop_timer(self.node_name, 'update_full')
                    }
                }
                break
            }
        }
        return
    },
    update_complications: function(why) {
        var need_update = {};
        var result = false;
        forward_input(why, this.installed_complications, need_update);
        if (get_common().U('DIAL_INFO') === 'ON') {
            for (var index in need_update) {
                if (typeof(need_update[index].draw) === 'object') {
                    result = true;
                    for (var index2 in need_update[index].draw) {
                        this.complications.draw[index2] = need_update[index].draw[index2];
                    }
                }
            }
        } else {
            this.complications.draw = {};
        }
        return result;
    },
    calculate_position: function(pos, size) {
        return {
            Ue: Math.floor(pos.x - size.w / 2),
            Qe: Math.floor(pos.y - size.h / 2),
        };
    },
    handle_watch_config_update: function() {
        for (var key in this.config.layout) {
            var layout = this.config.layout[key];
            if ((layout === undefined) || (is_empty_string(layout.name))) {
                continue;
            }
            if (layout.type == 'comp') {
                if (is_node_installed(layout.name)) {
                    if (layout.pos != undefined) {
                        layout.pos = this.calculate_position(layout.pos, layout.size);
                    }
                    var node_config = get_node_config(layout.name);
                    if (layout.data != undefined) {
                        node_config.data = layout.data;
                    }
                    this.installed_complications.push(layout.name);
                    init_node(layout.name);
                }
            }
        }
        if (this.config.config != undefined) {
            config_map = {
                'timeout_display_partial':    ['number', 'timeout_partial_display_update'],
                'timeout_display_full':       ['number', 'timeout_full_display_update'],
                'wrist_flick_hands_relative': ['boolean', 'wrist_flick_hands_relative'],
                'wrist_flick_move_hour':      ['number', 'wrist_flick_move_hour'],
                'wrist_flick_move_minute':    ['number', 'wrist_flick_move_minute'],
                'wrist_flick_duration':       ['number', 'wrist_flick_hands_timeout'],
                'powersave_display':          ['boolean', 'powersave_display'],
                'powersave_hands':            ['boolean', 'powersave_hands'],
            }
            for (var key in this.config.config) {
                var value = this.config.config[key];
                map = config_map[key]
                if(map == null){
                    continue
                }
                if(typeof value == map[0]){
                    this[map[1]] = value
                }
            }
        }
    },
    init: function () { // function 8
        this.handle_watch_config_update()
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
















