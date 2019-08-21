class AddSectionBase extends Marionette.ItemView {
	template() {
		return Marionette.TemplateCache.get( '#tmpl-elementor-add-section' );
	}

	attributes() {
		return {
			'data-view': 'choose-action',
		};
	}

	ui() {
		return {
			addNewSection: '.elementor-add-new-section',
			closeButton: '.elementor-add-section-close',
			addSectionButton: '.elementor-add-section-button',
			addTemplateButton: '.elementor-add-template-button',
			selectPreset: '.elementor-select-preset',
			presets: '.elementor-preset',
		};
	}

	events() {
		return {
			'click @ui.addSectionButton': 'onAddSectionButtonClick',
			'click @ui.addTemplateButton': 'onAddTemplateButtonClick',
			'click @ui.closeButton': 'onCloseButtonClick',
			'click @ui.presets': 'onPresetSelected',
		};
	}

	behaviors() {
		return {
			contextMenu: {
				behaviorClass: require( 'elementor-behaviors/context-menu' ),
				groups: this.getContextMenuGroups(),
			},
		};
	}

	className() {
		return 'elementor-add-section elementor-visible-desktop';
	}

	setView( view ) {
		this.$el.attr( 'data-view', view );
	}

	showSelectPresets() {
		this.setView( 'select-preset' );
	}

	closeSelectPresets() {
		this.setView( 'choose-action' );
	}

	getTemplatesModalOptions() {
		return {
			importOptions: {
				at: this.getOption( 'at' ),
			},
		};
	}

	getContextMenuGroups() {
		var hasContent = function() {
			return elementor.elements.length > 0;
		};

		return [
			{
				name: 'paste',
				actions: [
					{
						name: 'paste',
						title: elementor.translate( 'paste' ),
						isEnabled: this.isPasteEnabled.bind( this ),
						callback: () => $e.run( 'document/elements/paste', {
							element: elementor.getPreviewView(),
							at: this.getOption( 'at' ),
							rebuild: true,
						} ),
					},
				],
			}, {
				name: 'content',
				actions: [
					{
						name: 'copy_all_content',
						title: elementor.translate( 'copy_all_content' ),
						isEnabled: hasContent,
						callback: () => $e.run( 'document/elements/copyAll', {} ),
					}, {
						name: 'delete_all_content',
						title: elementor.translate( 'delete_all_content' ),
						isEnabled: hasContent,
						callback: () => $e.run( 'document/elements/empty' ),
					},
				],
			},
		];
	}

	isPasteEnabled() {
		return elementorCommon.storage.get( 'transfer' );
	}

	onAddSectionButtonClick() {
		this.showSelectPresets();
	}

	onAddTemplateButtonClick() {
		$e.run( 'library/show', this.getTemplatesModalOptions() );
	}

	onRender() {
		this.$el.html5Droppable( {
			axis: [ 'vertical' ],
			groups: [ 'elementor-element' ],
			placeholder: false,
			currentElementClass: 'elementor-html5dnd-current-element',
			hasDraggingOnChildClass: 'elementor-dragging-on-child',
			onDropping: this.onDropping.bind( this ),
		} );
	}

	onPresetSelected( event ) {
		this.closeSelectPresets();

		const selectedStructure = event.currentTarget.dataset.structure,
			parsedStructure = elementor.presetsFactory.getParsedStructure( selectedStructure );

		elementor.channels.data.trigger( 'element:before:add', {
			elType: 'section',
		} );

		$e.run( 'document/elements/createSection', {
			columns: parsedStructure.columnsCount,
			structure: selectedStructure,
			options: jQuery.extend( {}, this.options ),
		} );

		elementor.channels.data.trigger( 'element:after:add' );
	}

	onDropping() {
		if ( elementor.helpers.maybeDisableWidget() ) {
			return;
		}

		const historyId = $e.run( 'document/history/startLog', {
			elements: [ elementor.channels.panelElements.request( 'element:selected' ) ],
			type: 'add',
			returnValue: true,
		} );

		$e.run( 'document/elements/createSection', {
			columns: 1,
			returnValue: true,
		} ).addElementFromPanel();

		$e.run( 'document/history/endLog', { id: historyId } );
	}
}

export default AddSectionBase;
