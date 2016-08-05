import React from 'react';
import {isEqual} from 'lodash';

export default class Item extends React.Component {

	constructor(props) {
		super(props);
	}

	_itemWidth() {
		if (this.props.dimensions.justifyRows) {
			return (this.props.dimensions.gridWidth - this.props.dimensions.horizontalMargin * 2) / this.props.dimensions.itemsPerRow;
		} else {
			return this.props.dimensions.width;
		}
	}

	_itemLeft() {
		let column = this.props.index % this.props.dimensions.itemsPerRow;
		if (this.props.dimensions.justifyRows) {
			return this.props.dimensions.horizontalMargin + (column * (this.props.dimensions.gridWidth / this.props.dimensions.itemsPerRow));
		} else {
			return this.props.dimensions.horizontalMargin + (column * this.props.padding) + (column * this.props.dimensions.width);
		}
	}

	_itemTop() {
		let row = Math.floor(this.props.index / this.props.dimensions.itemsPerRow);
		return this.props.dimensions.verticalMargin + (row * this.props.padding) + (row * this.props.dimensions.height);
	}

	// LIFECYCLE

	shouldComponentUpdate(nextProps, nextState) {
		return !isEqual(this.props, nextProps);
	}

	// RENDER

	render() {
		const _style = {
			width: this._itemWidth(),
			height: this.props.dimensions.height,
			left: this._itemLeft(),
			top: this._itemTop(),
			position: 'absolute'
		};

		var props = {
			className: 'item',
			style: _style
		};

		return (
			<div {...props}>
				<div>{this.props.data}</div>
			</div>
		);

	}
}
