'use strict';

const { createClient } = require('@supabase/supabase-js');

const api = Object.freeze({ createClient });

globalThis.RadarSupabaseClient = api;
globalThis.supabase = api;

module.exports = api;
