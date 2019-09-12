import React, { FunctionComponent, useEffect, useRef, useState } from 'react';

import { Icon } from '@viaa/avo2-components';
import { CustomWindow } from '../../../shared/types/CustomWindow';

import './FlowPlayer.scss';

declare const flowplayer: any;

interface FlowPlayerProps {
	src: string | null;
	poster: string;
	logo?: string;
	title: string;
	start?: number;
	end?: number;
	onInit?: () => void;
}

export const FlowPlayer: FunctionComponent<FlowPlayerProps> = ({ src, poster, title, onInit }) => {
	const videoPlayerRef = useRef(null);
	let player: any = null;

	useEffect(() => {
		if (videoPlayerRef.current) {
			player = flowplayer(videoPlayerRef.current, {
				// DATA
				src,
				title,
				poster,

				// CONFIGURATION
				autoplay: true,
				ui: flowplayer.ui.LOGO_ON_RIGHT | flowplayer.ui.USE_DRAG_HANDLE,
			});
		}

		return () => {
			if (player) {
				player.destroy();
				player = null;
			}
		};
	}, [videoPlayerRef, src]);

	return src && poster ? (
		<div className="c-video-player" ref={videoPlayerRef} />
	) : (
		<div className="c-video-player">
			<div className="c-video-player__item">
				<img src={poster} />
			</div>
			<div className="c-play-overlay" onClick={onInit}>
				<div className="c-play-overlay__inner">
					<Icon name="play" />
				</div>
			</div>
		</div>
	);
};
