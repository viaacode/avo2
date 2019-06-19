import React, { SVGProps } from 'react';
export const Info = (props: SVGProps<SVGSVGElement>) => (
	<svg width={24} height={24} viewBox="0 0 24 24" fill="none" {...props}>
		<path
			d="M12 23C5.935 23 1 18.065 1 12S5.935 1 12 1s11 4.935 11 11-4.935 11-11 11zm0-20c-4.962 0-9 4.038-9 9 0 4.963 4.038 9 9 9 4.963 0 9-4.037 9-9 0-4.962-4.037-9-9-9z"
			fill="#000"
		/>
		<path
			d="M12 17a1 1 0 0 1-1-1v-4a1 1 0 0 1 2 0v4a1 1 0 0 1-1 1zM12 9c-.13 0-.26-.03-.38-.08-.13-.05-.23-.12-.33-.21-.18-.19-.29-.45-.29-.71 0-.06.01-.13.02-.19.01-.07.03-.13.06-.19.02-.06.05-.12.09-.18.03-.05.08-.1.12-.15.1-.09.2-.16.33-.21.37-.16.81-.06 1.09.21.04.05.09.1.12.15.04.06.07.12.09.18.03.06.05.12.06.19.01.06.02.13.02.19 0 .26-.11.52-.29.71l-.15.12c-.06.04-.12.07-.18.09-.06.03-.12.05-.18.06-.07.01-.14.02-.2.02z"
			fill="#000"
		/>
	</svg>
);
