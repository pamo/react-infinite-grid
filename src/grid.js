import React from 'react';
import {isEqual, merge} from 'lodash';
import Item from './item';

export default class InfiniteGrid extends React.Component {

	static get propTypes() {
		return {
			itemClassName: React.PropTypes.string,
			entries: React.PropTypes.arrayOf(React.PropTypes.object).isRequired,
			cellHeight: React.PropTypes.number,
			cellWidth: React.PropTypes.number,
			verticalMargin: React.PropTypes.number,
			horizontalMargin: React.PropTypes.number,
			cellPadding: React.PropTypes.number,
			wrapperHeight: React.PropTypes.number,
			lazyCallback: React.PropTypes.func,
			renderRangeCallback: React.PropTypes.func,
			buffer: React.PropTypes.number,
			justifyRows: React.PropTypes.bool,
			gridStyle: React.PropTypes.object,
			shouldComponentUpdate: React.PropTypes.func
		}
	}

	initialState() {
		return {
			initiatedLazyload: false,
			minHeight: window.innerHeight * 2,
			minItemIndex: 0,
			maxItemIndex: 100,
			itemDimensions: {
				height: this._itemHeight(),
				width: this._itemWidth(),
				gridWidth: 0,
				verticalMargin: 10,
				horizontalMargin: 10,
				justifyRows: true,
				itemsPerRow: 2,
			},
		};
	}

	constructor(props) {
		super(props);
		this.state = this.initialState();
		// bind the functions
		this._scrollListener = this._scrollListener.bind(this);
		this._updateItemDimensions = this._updateItemDimensions.bind(this);
		this._resizeListener = this._resizeListener.bind(this);
		this._visibleIndexes = this._visibleIndexes.bind(this);
	}

		// METHODS

	_wrapperStyle() {
		return {
			maxHeight: this._getGridHeight(),
			overflowY: 'scroll',
			width: '100%',
			height: this.props.wrapperHeight,
			WebkitOverflowScrolling: 'touch',
		};
	}

	_gridStyle() {
		return _.merge({
			position: 'relative',
			minHeight: this._getGridHeight(),
			minWidth: '100%',
		}, this.props.gridStyle);
	}

	_getGridRect() {
		return this.refs.grid.getBoundingClientRect();
	}

	_getGridHeight() {
		let rows = 0;

		if (this.props.entries.length < this.state.itemDimensions.itemsPerRow) {
			rows = 1;
		} else {
			rows = Math.floor(this.props.entries.length / this.state.itemDimensions.itemsPerRow);
			if (this.props.entries.length % this.state.itemDimensions.itemsPerRow > 0) {
				rows += 1;
			}
		}

		return (this.props.verticalMargin * 2) + (rows * this.state.itemDimensions.height) + (rows > 1 ? (rows - 1) * this.props.cellPadding : 0);
	}

	_getWrapperRect() {
		return this.refs.wrapper.getBoundingClientRect();
	}

	_visibleIndexes() {
		var itemsPerRow = this._itemsPerRow();

		// The number of rows that the user has scrolled past
		var scrolledPast = (this._scrolledPastRows() * itemsPerRow);
		if (scrolledPast < 0) scrolledPast = 0;

		// If i have scrolled past 20 items, but 60 are visible on screen,
		// we do not want to change the minimum
		var min = scrolledPast - itemsPerRow;
		if (min < 0) min = 0;

		// the maximum should be the number of items scrolled past, plus some
		// buffer
		var bufferRows = this._numVisibleRows() + this.props.buffer;
		var max = scrolledPast + (itemsPerRow * bufferRows);
		if (max > this.props.entries.length) max = this.props.entries.length;

		this.setState({
			minItemIndex: min,
			maxItemIndex: max,
		}, function() {
			this._lazyCallback();
		});
	}

	_updateItemDimensions() {
		this.setState({
			itemDimensions: {
				height: this._itemHeight(),
				width: this._itemWidth(),
				gridWidth: this._getGridRect().width,
				verticalMargin: this.props.verticalMargin,
				horizontalMargin: this.props.horizontalMargin,
				justifyRows: this.props.justifyRows,
				itemsPerRow: this._itemsPerRow(),
			},
			minHeight: this._totalRows(),
		});
	}

	_itemsPerRow() {
		return Math.floor((this._getGridRect().width + this.props.cellPadding - (this.props.horizontalMargin * 2)) / (this._itemWidth() + this.props.cellPadding));
	}

	_totalRows() {
		const rows = this.props.entries.length / this._itemsPerRow();
		const scrolledPastHeight = this.props.verticalMargin + (rows * this._itemHeight()) + (rows > 1 ? (rows - 1) * this.props.cellPadding : 0);
		if (scrolledPastHeight < 0) return 0;
		return scrolledPastHeight;
	}

	_scrolledPastRows() {
		const rect = this._getGridRect();
		const topScrollOffset = rect.height - rect.bottom;
		return Math.floor((topScrollOffset + this.props.cellPadding - this.props.verticalMargin) / (this._itemHeight() + this.props.cellPadding));
	}

	_itemHeight() {
		return this.props.cellHeight;
	}

	_itemWidth() {
		return this.props.cellWidth;
	}

	_numVisibleRows() {
		return Math.ceil((this._getWrapperRect().height + this.props.cellPadding - this.props.verticalMargin) / (this._itemHeight() + this.props.cellPadding));
	}

	_lazyCallback() {
		if (!this.state.initiatedLazyload && (this.state.maxItemIndex === this.props.entries.length) && this.props.lazyCallback) {
			this.setState({initiatedLazyload: true });
			this.props.lazyCallback(this.state.maxItemIndex);
		}
	}

	// LIFECYCLE

	componentWillMount() {
		window.addEventListener('resize', this._resizeListener);
	}

	componentDidMount() {
		this._updateItemDimensions();
		this._visibleIndexes();
	}

	componentWillReceiveProps(nextProps) {
		if (nextProps.entries.length > this.props.entries.length) {
			this.setState({
				initiatedLazyload: false,
			});
		}
		// Update these all the time because entries may change on the fly.
		this._updateItemDimensions();
		this._visibleIndexes();
	}

	componentDidUpdate(prevProps, prevState) {
		if (typeof this.props.renderRangeCallback === 'function') {
			this.props.renderRangeCallback(this.state.minItemIndex, this.state.maxItemIndex);
		}
	}

	shouldComponentUpdate(nextProps, nextState) {
		if (nextProps.wrapperHeight != this.props.wrapperHeight) {
			return true;
		}

		if (this.props.shouldComponentUpdate) {
			return this.props.shouldComponentUpdate.call(this, nextProps, nextState)
		}
		// or...
		return true
	}

	componentWillUnmount() {
		window.removeEventListener('resize', this._resizeListener);
	}

	// LISTENERS

	_scrollListener(event) {
		clearTimeout(this.scrollOffset);
		this.scrollOffset = setTimeout(() => {
			this._visibleIndexes();
		}, 10);
	}

	_resizeListener(event) {
			if (!this.props.wrapperHeight) {
					this.setState({
							wrapperHeight: window.innerHeight,
					});
			}
			this._updateItemDimensions();
			this._visibleIndexes();
	}

	// RENDER

	render() {
		var entries = [];

		if (this.props.entries.length) {
			for (let i = this.state.minItemIndex; i <= this.state.maxItemIndex; i++) {
				let entry = this.props.entries[i];
				if (!entry) {
					continue;
				}
				const itemProps = {
					key: 'item-' + i,
					index: i,
					padding: this.props.cellPadding,
					dimensions: this.state.itemDimensions,
					data: entry
				};
				entries.push(<Item {...itemProps} />);
			}
		}

		return (
			<div className='infinite-grid-wrapper' ref='wrapper' onScroll={this._scrollListener} style={this._wrapperStyle()}>
				<div ref='grid' className='infinite-grid' style={this._gridStyle()}>
					{entries}
				</div>
			</div>
		);

	}

};

InfiniteGrid.defaultProps = {
	buffer: 10,
	verticalMargin: 10,
	horizontalMargin: 10,
	cellPadding: 10,
	entries: [],
	cellHeight: 250,
	cellWidth: 250,
	justifyRows: true,
	gridStyle: {},
	shouldComponentUpdate: function(nextProps, nextState) {
		return !isEqual(this.state, nextState)
	}
}
