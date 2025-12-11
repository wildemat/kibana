import './space_selector.scss';
import React, { Component } from 'react';
import type { Observable } from 'rxjs';
import type { AppMountParameters, CoreStart } from '@kbn/core/public';
import type { CustomBranding } from '@kbn/core-custom-branding-common';
import type { Space } from '../../common';
import type { SpacesManager } from '../spaces_manager';
type ViewMode = 'grid' | 'table';
interface Props {
    spacesManager: SpacesManager;
    serverBasePath: string;
    customBranding$: Observable<CustomBranding>;
}
interface State {
    loading: boolean;
    searchTerm: string;
    spaces: Space[];
    error?: Error;
    customLogo?: string;
    viewMode: ViewMode;
}
export declare class SpaceSelector extends Component<Props, State> {
    private headerRef?;
    private customBrandingSubscription?;
    constructor(props: Props);
    setHeaderRef: (ref: HTMLElement | null) => void;
    componentDidMount(): void;
    componentWillUnmount(): void;
    loadSpaces(): void;
    render(): React.JSX.Element;
    getSearchField: () => React.JSX.Element | null;
    onSearch: (searchTerm?: string) => void;
    onViewModeChange: (viewMode: ViewMode) => void;
    getViewToggle: () => React.JSX.Element;
    getSearchAndToggle: () => React.JSX.Element | null;
}
export declare const renderSpaceSelectorApp: (services: Pick<CoreStart, "analytics" | "i18n" | "theme" | "userProfile" | "rendering">, { element }: Pick<AppMountParameters, "element">, props: Props) => () => boolean;
export {};
