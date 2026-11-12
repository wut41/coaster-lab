// after start-up: a link to a shared park opens it
TY10.booted = true; try { TY10.deepLink && TY10.deepLink() } catch (e) { console.warn('10.0 park link', e) }
