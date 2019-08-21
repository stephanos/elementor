module.exports = Marionette.Behavior.extend( {
	listenerAttached: false,

	// use beforeRender that runs after the collection is exist
	onBeforeRender: function() {
		if ( this.view.collection && ! this.listenerAttached ) {
			this.view.collection
				.on( 'update', this.saveCollectionHistory, this )
				.on( 'reset', this.onDeleteAllContent, this );
			this.listenerAttached = true;
		}
	},

	onDeleteAllContent: function( collection, event ) {
		if ( ! elementor.history.history.getActive() ) {
			// On Redo the History Listener is not active - stop here for better performance.
			return;
		}

		var modelsJSON = [];

		_.each( event.previousModels, function( model ) {
			modelsJSON.push( model.toJSON( { copyHtmlCache: true } ) );
		} );

		var historyItem = {
			type: 'remove',
			elementType: 'section',
			title: elementor.translate( 'all_content' ),
			history: {
				behavior: this,
				collection: event.previousModels,
				event: event,
				models: modelsJSON,
			},
		};

		$e.run( 'document/history/addItem', historyItem );
	},

	saveCollectionHistory: function( collection, event ) {
		if ( ! elementor.history.history.getActive() ) {
			// On Redo the History Listener is not active - stop here for better performance.
			return;
		}

		var historyItem,
			models,
			firstModel,
			type;

		if ( event.add ) {
			models = event.changes.added;
			firstModel = models[ 0 ];
			type = 'add';
		} else {
			models = event.changes.removed;
			firstModel = models[ 0 ];
			type = 'remove';
		}

		var title = elementor.history.history.getModelLabel( firstModel );

		// If it's an unknown model - don't save
		if ( ! title ) {
			return;
		}

		var modelsJSON = [];

		_.each( models, function( model ) {
			modelsJSON.push( model.toJSON( { copyHtmlCache: true } ) );
		} );

		historyItem = {
			type: type,
			elementType: firstModel.get( 'elType' ),
			elementID: firstModel.get( 'id' ),
			title: title,
			history: {
				behavior: this,
				collection: collection,
				event: event,
				models: modelsJSON,
			},
		};

		$e.run( 'document/history/addItem', historyItem );
	},

	add: function( models, toView, at = null ) {
		// Fix for case the iframe has been reloaded and the old `elementor-inner` is not exist.
		if ( toView.$el.hasClass( 'elementor-inner' ) ) {
			toView = elementor.getPreviewView();
		}

		models.forEach( ( model ) => {
			$e.run( 'document/elements/create', {
				element: toView,
				model: model,
				options: {
					at,
					edit: false,
				},
			} );
			if ( null !== at ) {
				at++;
			}
		} );
	},

	remove: function( models, fromView ) {
		models.forEach( ( model ) => {
			const element = fromView.children.find( ( view ) => view.model.id === model.id );

			$e.run( 'document/elements/delete', { element } );
		} );
	},

	restore: function( historyItem, isRedo ) {
		var	type = historyItem.get( 'type' ),
			history = historyItem.get( 'history' ),
			didAction = false,
			behavior;

		var BaseElementView = require( 'elementor-elements/views/base' );

		// Find the new behavior and work with him.
		if ( history.behavior.view instanceof BaseElementView ) {
			var modelID = history.behavior.view.model.get( 'id' ),
				view = elementor.history.history.findView( modelID );
			if ( view ) {
				behavior = view.getBehavior( 'CollectionHistory' );
			}
		}

		// Container or new Elements - Doesn't have a new behavior
		if ( ! behavior ) {
			behavior = history.behavior;
		}

		// Stop listen to undo actions
		behavior.view.collection.off( 'update', behavior.saveCollectionHistory );

		switch ( type ) {
			case 'add':
				if ( isRedo ) {
					this.add( history.models, behavior.view, history.event.index );
				} else {
					this.remove( history.models, behavior.view );
				}

				didAction = true;
				break;
			case 'remove':
				if ( isRedo ) {
					this.remove( history.models, behavior.view );
				} else {
					this.add( history.models, behavior.view, history.event.index );
				}

				didAction = true;
				break;
		}

		// Listen again
		behavior.view.collection.on( 'update', behavior.saveCollectionHistory, history.behavior );

		return didAction;
	},
} );

