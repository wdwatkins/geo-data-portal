var GDP = GDP || {};

// JSLint fixes
/*global $ */
/*global window */
/*global document */
/*jslint plusplus: true */

GDP.UI = function (args) {
	"use strict";
	args = args || {};

	// Initialization
	this.init = function (args) {
		args = args || {};

		// Attach arrays of algorithm names to their respective buttons
		$('#btn-choice-algorithm-areal').data({
			algorithms : [
				"gov.usgs.cida.gdp.wps.algorithm.FeatureWeightedGridStatisticsAlgorithm",
				"gov.usgs.cida.gdp.wps.algorithm.FeatureGridStatisticsAlgorithm",
				"gov.usgs.cida.gdp.wps.algorithm.FeatureCategoricalGridCoverageAlgorithm"
			]
		});
		$('#btn-choice-algorithm-subset').data({
			algorithms : [
				"gov.usgs.cida.gdp.wps.algorithm.FeatureCoverageOPeNDAPIntersectionAlgorithm",
				"gov.usgs.cida.gdp.wps.algorithm.FeatureCoverageIntersectionAlgorithm"
			]
		});

		// Fix the header of the application by removing unused elements in the 
		// right container
		$('#ccsa-area').children().slice(0, 2).remove();

		var me = this,
			updateOfferingMaps = function () {
				GDP.CONFIG.cswClient.getDomain({
					propertyName : 'keyword',
					callbacks : {
						success : [
							function (cswGetDomainResponseObject) {
								var dvIdx,
									value,
									domainValues = cswGetDomainResponseObject.DomainValues[0].ListOfValues;

								for (dvIdx = 0; dvIdx < domainValues.length; dvIdx++) {
									value = domainValues[dvIdx].Value.value;
									if (value.toLowerCase().indexOf('gov.usgs.cida.gdp.wps') !== -1) {
										GDP.CONFIG.offeringMaps.wpsToCsw[value] = {};
									}
								}

								this.getRecordsByKeywordsFromServer({
									scope : me,
									keywords : [Object.keys(GDP.CONFIG.offeringMaps.wpsToCsw)],
									callbacks : {
										success : [
											function (cswGetRecRespObj) {
												var records = cswGetRecRespObj.records,
													wpsToCsw = GDP.CONFIG.offeringMaps.wpsToCsw,
													cswToWps = GDP.CONFIG.offeringMaps.cswToWps,
													rIdx,
													record,
													algIdx,
													algName,
													ident,
													url,
													algorithm,
													algorithmArray;

												for (rIdx = 0; rIdx < records.length; rIdx++) {
													record = records[rIdx];
													ident = record.fileIdentifier.CharacterString.value;
													url = '';
													if (!GDP.CONFIG.offeringMaps.cswIdentToRecord[ident]) {
														GDP.CONFIG.offeringMaps.cswIdentToRecord[ident] = record;
													}

													algorithmArray = GDP.CONFIG.cswClient.getAlgorithmArrayFromRecord({
														record : record
													});

													for (algIdx = 0; algIdx < algorithmArray.length; algIdx++) {
														algorithm = algorithmArray[algIdx];
														if (!wpsToCsw[algorithm][ident]) {
															wpsToCsw[algorithm][ident] = record;
														}
													}

													if (!cswToWps[ident]) {
														cswToWps[ident] = [];
													}
												}

												for (algName in wpsToCsw) {
													if (wpsToCsw.hasOwnProperty(algName)) {
														for (ident in wpsToCsw[algName]) {
															if (wpsToCsw[algName].hasOwnProperty(ident)) {
																if (!cswToWps[ident]) {
																	cswToWps[ident] = [];
																}
																cswToWps[ident].push(algName);
															}
														}
													}
												}
												this.initializationCompleted();
											}
										],
										error : [
											function (error) {
												GDP.CONFIG.ui.errorEncountered({
													data : error,
													recoverable : false
												});
											}
										]
									}
								});
							}
						],
						error : [
							function (error) {
								GDP.CONFIG.ui.errorEncountered({
									data : error,
									recoverable : false
								});
							}
						]
					}
				});
			},
			buttonSelected = function (event) {
				var me = this,
					button = event.target,
					buttonId = button.id,
					keywords = [],
					dbIdx = 0,
					dId,
					depressedButtons = $('#row-choice-start label.active input'), // [:(]
					depressedButtonIds = [event.target.id], // [:(].killMe
					records,
					btnDatasetAllId = 'btn-choice-dataset-all',
					btnDatasetClimateId = 'btn-choice-dataset-climate',
					btnDatasetLandscapeId = 'btn-choice-dataset-landscape',
					btnAlgorithmArealId = 'btn-choice-algorithm-areal',
					btnAlgorithmSubsetId = 'btn-choice-algorithm-subset',
					arealAlgs = $('#' + btnAlgorithmArealId).data('algorithms'),
					subsetAlgs = $('#' + btnAlgorithmSubsetId).data('algorithms');

				for (dbIdx; dbIdx < depressedButtons.length; dbIdx++) {
					dId = depressedButtons[dbIdx].id;
					if (depressedButtonIds.indexOf(dId) === -1) {
						depressedButtonIds.push(dId);
					}
				}

				if (buttonId === btnDatasetAllId) {
					records = GDP.CONFIG.offeringMaps.cswIdentToRecord;
				} else if (buttonId === btnDatasetClimateId) {
					keywords = [['*climate*']];
					if (depressedButtonIds.indexOf(btnAlgorithmArealId) !== -1) {
						keywords.push(arealAlgs);
					}
					if (depressedButtonIds.indexOf(btnAlgorithmSubsetId) !== -1) {
						keywords.push(subsetAlgs);
					}
				} else if (buttonId === btnDatasetLandscapeId) {
					keywords = [['*landscape*']];
					if (depressedButtonIds.indexOf(btnAlgorithmArealId) !== -1) {
						keywords.push(arealAlgs);
					}
					if (depressedButtonIds.indexOf(btnAlgorithmSubsetId) !== -1) {
						keywords.push(subsetAlgs);
					}
				} else if (buttonId === btnAlgorithmArealId) {
					if (depressedButtonIds.indexOf(btnDatasetClimateId) === -1 &&
							depressedButtonIds.indexOf(btnDatasetLandscapeId) === -1) {
						records = GDP.CONFIG.wpsClient.getRecordsByAlgorithmArray({
							algorithms : arealAlgs
						});
					} else {
						keywords.push(arealAlgs);
						if (depressedButtonIds.indexOf(btnDatasetClimateId) !== -1) {
							keywords.push(['*climate*']);
						} else if (depressedButtonIds.indexOf(btnDatasetLandscapeId) !== -1) {
							keywords.push(['*landscape*']);
						}
					}
				} else if (buttonId === btnAlgorithmSubsetId) {
					if (depressedButtonIds.indexOf(btnDatasetClimateId) === -1 &&
							depressedButtonIds.indexOf(btnDatasetLandscapeId) === -1) {
						records = GDP.CONFIG.wpsClient.getRecordsByAlgorithmArray({
							algorithms : subsetAlgs
						});
					} else {
						keywords.push(subsetAlgs);
						if (depressedButtonIds.indexOf(btnDatasetClimateId) !== -1) {
							keywords.push(['*climate*']);
						} else if (depressedButtonIds.indexOf(btnDatasetLandscapeId) !== -1) {
							keywords.push(['*landscape*']);
						}
					}
				}

				if (records) {
					me.updateCswDropdown({
						offerings : records
					});
				} else {
					GDP.CONFIG.cswClient.getRecordsByKeywordsFromServer({
						scope : me,
						keywords : keywords,
						callbacks : {
							success : [
								function (cswGetRecRespObj) {
									var records;

									records = GDP.CONFIG.cswClient.getCswIdentToRecordMapFromRecordsArray({
										records : cswGetRecRespObj.records
									});

									if (Object.keys(cswGetRecRespObj).length > 0) {
										me.updateCswDropdown({
											offerings : records
										});
									} else {
										$.bootstrapGrowl('Could not find any records to match your criteria',
											{
												type : 'info',
												'allow_dismiss' : false
											});
									}
								}
							],
							error : [
								function (error) {
									GDP.CONFIG.ui.errorEncountered({
										data : error,
										recoverable : false
									});
								}
							]
						}
					});
				}
			};

		this.removeOverlay = function () {
			$('#overlay').fadeOut(800,
				function () {
					$('#overlay').remove();
				});
		};

		this.cswDropdownChanged = function (event) {
			var value = event.target.value,
				validAlgorithms,
				record,
				ident,
				title,
				subtitle,
				content,
				isDatasetChosen,
				datasetDropdown = $('#form-control-select-csw'),
				proceedRow = $('#row-proceed'),
				fullInfoLink = $('#view-full-info-link'),
				contentContainer = $('#p-csw-information-content'),
				titleContainer = $('#p-csw-information-title');

			if (!value) {
				proceedRow.fadeOut();
				titleContainer.html('');
				contentContainer.html('');
			} else {
				ident = value.split(';')[1];
				record = GDP.CONFIG.offeringMaps.cswIdentToRecord[ident];
				validAlgorithms = GDP.CONFIG.offeringMaps.cswToWps[ident];
				title = GDP.CONFIG.cswClient.getTitleFromRecord({
					record : record
				});
				subtitle = $(event.target).find('option[value="' + value + '"]').html();
				isDatasetChosen = $('.btn-group label.active input').attr('id').indexOf('dataset') !== -1;

				if (subtitle !== title) {
					title += '<br />' + subtitle;
				}

				content = GDP.CONFIG.cswClient.getAbstractFromRecord({
					record : record
				});

				titleContainer.html(title);
				contentContainer.html(window.replaceURLWithHTMLLinks(content));
				contentContainer.append('&nbsp;&nbsp;&nbsp;&nbsp;',
					$('<a />')
						.attr({
						'id' :  'view-full-info-link',
						'ident' : ident
					})
						.html('View Full Record')
					);

				if (datasetDropdown.val() && me.isProcessingButtonSelected()) {
					proceedRow.fadeIn();
					me.bindProceedButton();
				}

				$('#view-full-info-link').on('click', function () {
					var ident = this.attributes.ident.value;
					GDP.CONFIG.cswClient.createFullRecordView({
						identifier : ident
					});

					// The excat client we are using is specific to the GDP so it has
					// GDP functionality attached to some of the hrefs. We need to 
					// extract the links that the javascript are bound to and make 
					// the href regular hrefs
					$('.meta-value a[href*="javascript"]').each(function (i, o) {
						var hrefAttr = o.attributes.href.value,
							firstIndex = hrefAttr.indexOf("'") + 1,
							lastIndex = hrefAttr.lastIndexOf("'"),
							rootHref = hrefAttr.substring(firstIndex, lastIndex);

						$(o).attr({
							'href' : rootHref,
							'target' : '_datasetTab'
						});
					});

					// Create HTML links in the full record view
					$('.captioneddiv .meta td.meta-value').each(function (i, o) {
						$(o).html(window.replaceURLWithHTMLLinks($(o).html()));
					});

					$('#full-record-modal').modal('show');
				});
			}
		};

		this.updateCswDropdown = function (args) {
			args = args || {};
			var offerings =  args.offerings || GDP.CONFIG.offeringMaps.cswToWps,
				datasetDropDown = $('#form-control-select-csw'),
				cswGroupRow = $('#row-csw-group'),
				ident,
				option,
				currentlySelectedOption = datasetDropDown.val();

			datasetDropDown.empty();
			datasetDropDown.append(
				$('<option />')
					.attr({
						name : '',
						value : '',
						label : ''
					}).html('')
			);
			for (ident in offerings) {
				if (offerings.hasOwnProperty(ident)) {
					option = GDP.CONFIG.cswClient.createOptionFromRecord({
						record : GDP.CONFIG.offeringMaps.cswIdentToRecord[ident]
					});
					datasetDropDown.append(option);
				}
			}

			datasetDropDown.val(currentlySelectedOption);
			datasetDropDown.trigger('change');

			if (cswGroupRow.css('display') === 'none') {
				cswGroupRow.fadeIn();
			}

			datasetDropDown.off('change', this.cswDropdownChanged);
			datasetDropDown.on('change', this.cswDropdownChanged);
		};

		this.errorEncountered = function (args) {
			args = args || {};

			var data = args.data,
				recoverable = args.recoverable;

			if (recoverable) {
				$.bootstrapGrowl(data,
					{
						type : 'info',
						'allow_dismiss' : false
					});
			} else {
				$('#unrecoverable-error-modal .modal-body').append(
					$('<div />').attr({
						'id' : 'unrecoverable-error-modal-modal-body-content'
					}).html(data + '<br /><br />Please try to reload the application or contact the system administrator for support with this error.')
				);
				$('#unrecoverable-error-modal').modal('show');
			}
		};

		this.bindProceedButton = function () {
			$('#btn-proceed').off();

			$('#btn-proceed').on('click', function () {
				var csw,
					cswIdent,
					cswUrl,
					win,
					url,
					pKey,
					aIdx,
					algorithm,
					algorithms = [],
					buttonAlgoritms,
					recordAlgorithms,
					formContainer,
					form,
					incomingParams = GDP.CONFIG.incomingParams,
					datasetDropdown = $('#form-control-select-csw'),
					datasetDropdownValue = datasetDropdown.val(),
					algorithmButtonId = $('#col-choice-start-algorithm .btn-group label.active input').attr('id');


				if (datasetDropdownValue) {
					cswUrl = datasetDropdownValue.split(';')[0];
					cswIdent = datasetDropdownValue.split(';')[1];

					recordAlgorithms = GDP.CONFIG.cswClient.getAlgorithmArrayFromRecord({
						record : GDP.CONFIG.offeringMaps.cswIdentToRecord[cswIdent]
					});

					// Try to figure out which algorithsm from the selected 
					// algorithm button go with the selected dataset and only 
					// pass in the union of those algorithms over to the GDP
					buttonAlgoritms = $('#' + algorithmButtonId).data('algorithms');
					for (aIdx = 0; aIdx < buttonAlgoritms.length; aIdx++) {
						algorithm = buttonAlgoritms[aIdx];
						if (recordAlgorithms.indexOf(buttonAlgoritms[aIdx]) !== -1) {
							algorithms.push(buttonAlgoritms[aIdx]);
						}
					}
					algorithms = algorithms.join(',');

					csw = encodeURIComponent(cswUrl);

					if (GDP.CONFIG.incomingMethod === 'GET') {
						url = GDP.CONFIG.hosts.gdp + '?dataset=' + csw + '&algorithm=' + algorithms;

						for (pKey in incomingParams) {
							if (incomingParams.hasOwnProperty(pKey) && pKey) {
								url += '&' + pKey + '=' + incomingParams[pKey];
							}
						}

						win = window.open(url);
						win.focus();
					} else if (GDP.CONFIG.incomingMethod === 'POST') {
						$('#gdp-redir-div').remove();
						formContainer = $('<div />').attr({
							'id': 'gdp-redir-div',
							'style': 'display:none;'
						});

						form = $('<form />').attr({
							'action': GDP.CONFIG.hosts.gdp,
							'method': 'POST',
							'name': 'gdp-redirect-post-form'
						});

						for (pKey in incomingParams) {
							if (incomingParams.hasOwnProperty(pKey) && pKey) {
								form.append($('<input />').attr({
									'type': 'hidden',
									'name': pKey,
									'value': incomingParams[pKey]
								}));
							}
						}

						form.append($('<input />').attr({
							'type': 'hidden',
							'name': 'algorithm',
							'value': algorithms
						}));

						form.append($('<input />').attr({
							'type': 'hidden',
							'name': 'dataset',
							'value': csw
						}));

						formContainer.append(form);
						$('body').append(formContainer);
						document.forms['gdp-redirect-post-form'].submit();
					}
				}

			});
		};

		this.isProcessingButtonSelected = function () {
			return $('#col-choice-start-algorithm label.active').length > 0 ? true : false;
		};

		this.initializationCompleted = function () {
			$('#row-choice-start input').on('change', $.proxy(buttonSelected, this));
			this.removeOverlay();
		};

		GDP.CONFIG.cswClient.requestGetCapabilities({
			callbacks : {
				success : [
					function () {
						if (GDP.CONFIG.wpsClient.capabilitiesDocument) {
							updateOfferingMaps();
						}
					}
				],
				error : [
					function (error) {
						GDP.CONFIG.ui.errorEncountered({
							data : error,
							recoverable : false
						});
					}
				]
			}
		});

		GDP.CONFIG.wpsClient.requestGetCapabilities({
			callbacks : {
				success : [
					function (capabilities) {
						if (GDP.CONFIG.cswClient.capabilitiesDocument) {
							updateOfferingMaps();
						}
					}
				],
				error : [
					function (error) {
						GDP.CONFIG.ui.errorEncountered({
							data : error,
							recoverable : false
						});
					}
				]
			}
		});
	};

	this.init();

	return {
		isProcessingButtonSelected : this.isProcessingButtonSelected,
		bindProceedButton : this.bindProceedButton,
		updateCswDropdown : this.updateCswDropdown,
		cswDropdownUpdated : this.cswDropdownChanged,
		errorEncountered : this.errorEncountered,
		removeOverlay : this.removeOverlay
	};
};