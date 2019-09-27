import React, { FunctionComponent, MutableRefObject, useEffect, useRef } from 'react';

import { Icon } from '@viaa/avo2-components';

import { getEnv } from '../../../shared/helpers/env';

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

export const FlowPlayer: FunctionComponent<FlowPlayerProps> = ({
	src,
	poster,
	title,
	onInit,
	start,
	end,
}) => {
	const videoContainerRef = useRef(null);
	const videoPlayerRef: MutableRefObject<any | undefined> = useRef<any>();

	const cuePointEndListener = () => {
		if (videoContainerRef.current) {
			videoPlayerRef.current.pause();
		}
	};

	useEffect(() => {
		if (videoContainerRef.current) {
			// Initialize FlowPlayer
			videoPlayerRef.current = flowplayer(videoContainerRef.current, {
				// DATA
				title,
				poster,
				src,

				// CONFIGURATION
				token: getEnv('FLOW_PLAYER_TOKEN'),
				autoplay: true,
				ui: flowplayer.ui.LOGO_ON_RIGHT | flowplayer.ui.USE_DRAG_HANDLE,
				plugins: ['subtitles', 'chromecast', 'cuepoints'],

				// CUEPOINTS
				cuepoints: [{ start, end }],
				draw_cuepoints: true,
			});

			// Start video at start cuepoint
			if (start) {
				videoPlayerRef.current.currentTime = start;
			}

			// Pause video at end cuepoint
			if (end) {
				videoPlayerRef.current.on('cuepointend', cuePointEndListener);
			}
		}

		return () => {
			if (videoPlayerRef.current) {
				(videoPlayerRef.current as any).destroy();
				videoPlayerRef.current = null;
			}
		};
	}, [videoContainerRef, src, poster, title]);

	// Re-render start/end cuepoints when cropping video
	useEffect(() => {
		if (videoContainerRef.current) {
			videoPlayerRef.current.emit(flowplayer.events.CUEPOINTS, { cuepoints: [{ start, end }] });
		}
	}, [start, end]);

	return src && poster ? (
		<div
			className="c-video-player t-player-skin--dark"
			data-player-id={getEnv('FLOW_PLAYER_ID')}
			ref={videoContainerRef}
		/>
	) : (
		<div className="c-video-player t-player-skin--dark" onClick={onInit}>
			<div className="c-video-player__item c-video-player__thumbnail">
				<img src={poster} alt={`Thumbnail voor video over ${title}.`} />
			</div>
			<div className="c-play-overlay">
				<div className="c-play-overlay__inner">
					<Icon name="play" className="c-play-overlay__button" />
				</div>
			</div>
		</div>
	);
};
