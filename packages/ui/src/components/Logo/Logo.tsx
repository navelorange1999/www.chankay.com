import {FC} from "react";

export interface LogoProps extends React.ImgHTMLAttributes<HTMLImageElement> {}

export const Logo: FC<LogoProps> = (props) => {
	return <img {...props} />;
};
