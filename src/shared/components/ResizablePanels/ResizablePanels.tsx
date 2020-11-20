import React, { Component, ReactNode, RefObject } from 'react';
import ReactDOM from 'react-dom';

// Based on package: https://github.com/feliperrf/ResizablePanelsReact

// Components
import Resizer from './components/Resizer';

interface ResizablePanelsProps {
	children: ReactNode[];
	panelsSize: any;
	bkcolor?: any;
	width?: any;
	height?: any;
	displayDirection: any;
	resizerSize?: string;
	sizeUnitMeasure: string;
	resizerColor?: string;
	startResize?: () => void;
	onResize?: (displacement: number) => void;
	stopResize?: () => void;
	initialPos?: any;
}

interface ResizablePanelsState {
	panelsSize: number[];
	resizing: boolean;
	currentPanel?: number | null;
	initialPos?: number;
	displacement?: number;
}

export default class ResizablePanels extends Component<ResizablePanelsProps, ResizablePanelsState> {
	private readonly resizable: RefObject<HTMLDivElement>;

	constructor(props: ResizablePanelsProps) {
		super(props);

		this.resizable = React.createRef();
		this.state = {
			panelsSize: [],
			resizing: false,
		};
	}

	componentDidMount() {
		this.setState({ ...this.state, panelsSize: this.props.panelsSize });

		(ReactDOM.findDOMNode(this) as any).addEventListener('mousemove', this.executeResize);
		(ReactDOM.findDOMNode(this) as any).addEventListener('mouseup', this.stopResize);
		(ReactDOM.findDOMNode(this) as any).addEventListener('mouseleave', this.stopResize);
	}

	render() {
		const { bkcolor } = this.props;
		const rest = this.props.children.length > 1 ? this.props.children.slice(1) : [];

		return (
			<div
				style={{
					width: this.props.width,
					height: this.props.height,
					background: bkcolor,
					display: 'flex',
					flexDirection: this.props.displayDirection || 'row',
				}}
				ref={this.resizable}
			>
				{this.renderFirst()}
				{this.renderRest(rest)}
			</div>
		);
	}

	renderFirst() {
		return this.renderChildren(this.props.children[0], 0);
	}

	renderRest(rest: any) {
		return [].concat(
			...rest.map((children: ReactNode[], index: number) => {
				return [this.renderResizer(index + 1), this.renderChildren(children, index + 1)];
			})
		);
	}

	renderChildren(children: ReactNode, index: any) {
		return (
			<div
				className="resizable-fragment"
				key={`fragment_${index}`}
				style={this.getStyle(index)}
			>
				{children}
			</div>
		);
	}

	renderResizer(index: number) {
		return (
			<Resizer
				size={this.props.resizerSize || '10px'}
				key={`resizer_${index}`}
				direction={this.props.displayDirection}
				onMouseDown={(e: MouseEvent) => this.startResize(e, index)}
				color={this.props.resizerColor}
			/>
		);
	}

	displayDirectionIsColumn() {
		return this.props.displayDirection === 'column';
	}

	getStyle(index: number) {
		const panelsSize = this.state.panelsSize || [];
		const panelsSizeLength = panelsSize.length - 1;
		const size = index > panelsSizeLength ? '100%' : panelsSize[index];
		const unitMeasure = this.props.sizeUnitMeasure || 'px';

		if (this.displayDirectionIsColumn()) {
			return {
				height: `${size}${unitMeasure}`,
				width: `100%`,
				overflow: 'hidden',
			};
		}

		return {
			height: `100%`,
			width: `${size}${unitMeasure}`,
			overflow: 'hidden',
		};
	}

	startResize(e: MouseEvent, index: number) {
		e.preventDefault();
		this.setState({
			...this.state,
			resizing: true,
			currentPanel: index,
			initialPos: this.displayDirectionIsColumn() ? e.clientY : e.clientX,
		});
		if (this.props.startResize) {
			this.props.startResize();
		}
	}

	executeResize = (e: MouseEvent) => {
		if (this.state.resizing) {
			const currentMousePosition = this.displayDirectionIsColumn() ? e.clientY : e.clientX;

			const displacement: number = (this.state.initialPos || 0) - currentMousePosition;

			const nextPanelsSize = this.getNextPanelsSize(displacement);

			this.setState((state) => ({
				...state,
				displacement,
				initialPos: currentMousePosition,
				panelsSize: nextPanelsSize,
			}));
			if (this.props.onResize) {
				this.props.onResize(displacement);
			}
		}
	};

	stopResize = () => {
		this.setState({
			...this.state,
			resizing: false,
			currentPanel: null,
			displacement: 0,
		});
		if (this.props.stopResize) {
			this.props.stopResize();
		}
	};

	getCurrentComponentSize(): number {
		if (!this.resizable.current) {
			return 0;
		}
		const componentSizes = this.resizable.current.getBoundingClientRect();

		return this.displayDirectionIsColumn() ? componentSizes.height : componentSizes.width;
	}

	getNextPanelsSize(displacement: number) {
		const currentPanelsSize = this.state.panelsSize;
		const usePercentage = this.props.sizeUnitMeasure === '%';

		const resizeSize = usePercentage ? this.convertToPercentage(displacement) : displacement;

		return currentPanelsSize.map((panelSize, index) => {
			if (index === this.state.currentPanel) {
				return panelSize + resizeSize;
			}

			if (index === (this.state.currentPanel || 1) - 1) {
				return panelSize - resizeSize;
			}

			return panelSize;
		});
	}

	convertToPercentage(displacement: number) {
		const size = this.getCurrentComponentSize();

		return (displacement * 100) / size;
	}
}
