import { ThreeDots } from 'react-loader-spinner';

import ThemedButton from './ThemedButton';

import './LoadingButton.css';

function LoadingButton({
	children,
	isLoading = false,
	onClick,
}: {
	children: React.ReactNode;
	isLoading?: boolean;
	onClick: () => void;
}) {
	return (
		<div className="loading-button">
			<ThemedButton ariaDisabled={isLoading} onClick={onClick}>
				{children}
				{isLoading && (
					<ThreeDots width="1.5rem" color="white" wrapperClass="loader" />
				)}
			</ThemedButton>
		</div>
	);
}

export default LoadingButton;
