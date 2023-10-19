import { ThreeDots } from "react-loader-spinner";
import ThemedButton, { ThemedButtonProps } from "./ThemedButton";
import "./Loader.css";

function LoadingButton({
  children,
  isLoading = false,
  ...buttonProps
}: ThemedButtonProps & {
  isLoading?: boolean;
}) {
  return (
    <ThemedButton {...buttonProps}>
      {children}
      <ThreeDots width="24px" color="white" wrapperClass="loader" />
    </ThemedButton>
  );
}

export default LoadingButton;
