import React, { FunctionComponent, ReactNode } from 'react';

import { Container, useSlot } from '@viaa/avo2-components';

import { TopBar } from '../../components';

import './AdminLayout.scss';
import {
	AdminLayoutBody,
	AdminLayoutHeader,
	AdminLayoutTopBarCenter,
	AdminLayoutTopBarRight,
} from './AdminLayout.slots';

interface AdminLayoutProps {
	children?: ReactNode;
	className?: string;
	pageTitle?: string;
	onClickBackButton?: () => void;
	size: 'small' | 'medium' | 'large' | 'full-width' | 'no-margin'; // TODO move this to a type in the Container component in the components repo
}

const AdminLayout: FunctionComponent<AdminLayoutProps> = ({
	children,
	className,
	pageTitle,
	onClickBackButton,
	size,
}) => {
	const body = useSlot(AdminLayoutBody, children);
	const topBarCenter = useSlot(AdminLayoutTopBarCenter, children);
	const topBarRight = useSlot(AdminLayoutTopBarRight, children);
	const header = useSlot(AdminLayoutHeader, children);

	return (
		<div className="l-admin">
			<TopBar
				onClickBackButton={onClickBackButton}
				title={pageTitle}
				center={topBarCenter}
				right={topBarRight}
				size={size === 'no-margin' ? 'full-width' : size}
			/>
			<div className="m-admin-layout-content">
				{header}
				{size !== 'no-margin' && (
					<Container className={className} mode="vertical" size="small">
						<Container mode="horizontal" size={size}>
							{body || children}
						</Container>
					</Container>
				)}
				{size === 'no-margin' && <>{body || children}</>}
			</div>
		</div>
	);
};

export default AdminLayout;
