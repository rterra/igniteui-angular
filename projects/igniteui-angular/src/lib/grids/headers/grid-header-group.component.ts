import {
    Component,
    HostBinding,
    Input,
    ViewChild,
    QueryList,
    ViewChildren,
    forwardRef,
    ChangeDetectionStrategy,
    ChangeDetectorRef,
    DoCheck,
    ElementRef,
    HostListener
} from '@angular/core';
import { IgxColumnComponent } from '../columns/column.component';
import { IgxFilteringService } from '../filtering/grid-filtering.service';
import { GridBaseAPIService } from '../api.service';
import { IgxGridBaseDirective } from '../grid-base.directive';
import { IgxColumnResizingService } from '../resizing/resizing.service';
import { IgxGridHeaderComponent } from './grid-header.component';
import { IgxGridFilteringCellComponent } from '../filtering/base/grid-filtering-cell.component';
import { isIE } from '../../core/utils';
import { GridType } from '../common/grid.interface';

const Z_INDEX = 9999;

/**
 * @hidden
 */
@Component({
    changeDetection: ChangeDetectionStrategy.OnPush,
    preserveWhitespaces: false,
    selector: 'igx-grid-header-group',
    templateUrl: './grid-header-group.component.html'
})
export class IgxGridHeaderGroupComponent implements DoCheck {

    @HostBinding('style.-ms-grid-row-span')
    get gridRowSpan(): number {
        return this.column.gridRowSpan;
    }

    @HostBinding('style.-ms-grid-column-span')
    get gridColumnSpan(): number {
        return this.column.gridColumnSpan;
    }


    @HostBinding('style.grid-row-end')
    get rowEnd(): number {
        return this.column.rowEnd;
    }

    @HostBinding('style.grid-column-end')
    get colEnd(): number {
        return this.column.colEnd;
    }

    @HostBinding('style.-ms-grid-row')
    @HostBinding('style.grid-row-start')
    get rowStart(): number {
        return this.column.rowStart;
    }

    @HostBinding('style.-ms-grid-column')
    @HostBinding('style.grid-column-start')
    get colStart(): number {
        return this.column.colStart;
    }

    /**
     * Gets the column of the header group.
     * @memberof IgxGridHeaderGroupComponent
     */
    @Input()
    public column: IgxColumnComponent;

    /**
     * Gets the `id` of the grid in which the header group is stored.
     * @memberof IgxGridHeaderGroupComponent
     */
    @Input()
    public gridID: string;

    /**
     * @hidden
     */
    @ViewChild(IgxGridHeaderComponent)
    public headerCell: IgxGridHeaderComponent;

    /**
     * @hidden
     */
    @ViewChild(IgxGridFilteringCellComponent)
    public filterCell: IgxGridFilteringCellComponent;

    /**
     * @hidden
     */
    @ViewChildren(forwardRef(() => IgxGridHeaderGroupComponent), { read: IgxGridHeaderGroupComponent })
    public children: QueryList<IgxGridHeaderGroupComponent>;

    /**
     * Gets the width of the header group.
     * @memberof IgxGridHeaderGroupComponent
     */
    get width() {
        return this.grid.getHeaderGroupWidth(this.column);
    }

    /**
     * Gets the style classes of the header group.
     * @memberof IgxGridHeaderGroupComponent
     */
    @HostBinding('class')
    get styleClasses(): string {
        const defaultClasses = [
            'igx-grid__thead-item',
            this.column.headerGroupClasses
        ];

        const classList = {
            'igx-grid__th--pinned': this.isPinned,
            'igx-grid__th--pinned-last': this.isLastPinned,
            'igx-grid__th--pinned-first': this.isFirstPinned,
            'igx-grid__drag-col-header': this.isHeaderDragged,
            'igx-grid__th--filtering': this.isFiltered
        };

        for (const className of Object.keys(classList)) {
            if (classList[className]) {
                defaultClasses.push(className);
            }
        }
        return defaultClasses.join(' ');
    }

    /**
     * @hidden
     */
    @HostBinding('style.z-index')
    get zIndex() {
        if (!this.column.pinned) {
            return null;
        }
        return Z_INDEX - this.grid.pinnedColumns.indexOf(this.column);
    }

    /**
     * Gets the grid of the header group.
     * @memberof IgxGridHeaderGroupComponent
     */
    get grid(): any {
        return this.gridAPI.grid;
    }

    /**
     * Gets whether the header group belongs to a column that is filtered.
     * @memberof IgxGridHeaderGroupComponent
     */
    get isFiltered(): boolean {
        return this.filteringService.filteredColumn === this.column;
    }

    /**
     * Gets whether the header group is stored in the last column in the pinned area.
     * @memberof IgxGridHeaderGroupComponent
     */
    get isLastPinned(): boolean {
        return !this.grid.hasColumnLayouts ? this.column.isLastPinned : false;
    }

    /**
     * Gets whether the header group is stored in the first column of the right pinned area.
     */
    get isFirstPinned(): boolean {
        return !this.grid.hasColumnLayouts ? this.column.isFirstPinned : false;
    }

    @HostBinding('style.display')
    get groupDisplayStyle(): string {
        return this.grid.hasColumnLayouts && this.column.children && !isIE() ? 'flex' : '';
    }

    /**
     * Gets whether the header group is stored in a pinned column.
     * @memberof IgxGridHeaderGroupComponent
     */
    get isPinned(): boolean {
        return this.column.pinned;
    }

    /**
     * Gets whether the header group belongs to a column that is moved.
     * @memberof IgxGridHeaderGroupComponent
     */
    get isHeaderDragged(): boolean {
        return this.grid.draggedColumn === this.column;
    }

    /**
     * @hidden
     */
    get hasLastPinnedChildColumn(): boolean {
        return this.column.allChildren.some(child => child.isLastPinned);
    }

    /**
     * @hidden
    */
    get hasFirstPinnedChildColumn(): boolean {
        return this.column.allChildren.some(child => child.isFirstPinned);
    }

    /**
     * @hidden
    */
    get selectable() {
        const selectableChildren = this.getSelectableChildren(this.column.children.toArray());
        return this.column.applySelectableClass
            && !this.selected && selectableChildren.length > 0
            && !this.grid.filteringService.isFilterRowVisible;
    }

    /**
     * @hidden
    */
    get selected() {
       return this.column.selected;
    }

    /**
     * @hidden
     */
    get height() {
        return this.element.nativeElement.getBoundingClientRect().height;
    }

    /**
     * @hidden
     */
    public groupClicked(event): void {
        const columnsToSelect = this.getSelectableChildren(this.column.children.toArray()).map(c => c.field);
        if (columnsToSelect.length > 0 && !this.grid.filteringService.isFilterRowVisible) {
            if (!this.selected) {
                this.grid.selectionService.selectColumns(columnsToSelect, !event.ctrlKey, event);
            } else {
                const selectedFields = this.grid.selectionService.getSelectedColumns();
                if ((selectedFields.length === columnsToSelect.length) && selectedFields.every(el => columnsToSelect.includes(el))
                    || event.ctrlKey) {
                    this.grid.selectionService.deselectColumns(columnsToSelect, event);
                } else {
                    this.grid.selectionService.selectColumns(columnsToSelect, !event.ctrlKey, event);
                }
            }
        }
    }

    private getSelectableChildren(children: IgxColumnComponent[]): IgxColumnComponent[] {
        let result: IgxColumnComponent[] = [];
        children.forEach(el => {
            if (el.selectable && !el.hidden) {
                if (el.children && el.columnGroup) {
                    result = result.concat(this.getSelectableChildren(el.children.toArray()));
                } else {
                    result.push(el);
                }
            }
        });
        return result;
    }

    /**
    * @hidden
    */
    public toggleExpandState(event): void {
        event.stopPropagation();
        this.column.expanded = !this.column.expanded;
    }

    /**
     * @hidden
     */
    @HostListener('mousedown', ['$event'])
    public onMouseDown(event): void {
        // hack for preventing text selection in IE and Edge while dragging the resizer
        event.preventDefault();
    }

    public ngDoCheck() {
        this.cdr.markForCheck();
    }
    /**
     * @hidden
     */
    public onPinterEnter() {
        this.column.applySelectableClass = true;
    }

    /**
     * @hidden
    */
    public onPointerLeave() {
        this.column.applySelectableClass = false;
    }

    constructor(private cdr: ChangeDetectorRef,
        public gridAPI: GridBaseAPIService<IgxGridBaseDirective & GridType>,
        public element: ElementRef,
        public colResizingService: IgxColumnResizingService,
        public filteringService: IgxFilteringService) { }
}
