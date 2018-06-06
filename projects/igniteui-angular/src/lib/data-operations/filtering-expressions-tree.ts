import { FilteringLogic, IFilteringExpression } from '../../public_api';

export declare interface IFilteringExpressionsTree {
    filteringOperands: (IFilteringExpressionsTree | IFilteringExpression)[];
    operator: FilteringLogic;

    find(fieldName: string): IFilteringExpressionsTree | IFilteringExpression;
    findIndex(fieldName: string): number;
}

export class FilteringExpressionsTree implements IFilteringExpressionsTree {
    filteringOperands: (IFilteringExpressionsTree | IFilteringExpression)[] = [];
    operator: FilteringLogic;

    constructor(operator: FilteringLogic) {
        this.operator = operator;
    }

    public find(fieldName: string): IFilteringExpressionsTree | IFilteringExpression {
        let index = this.findIndex(fieldName);

        if (index > -1) {
            return this.filteringOperands[index];
        }

        return null;
    }

    public findIndex(fieldName: string): number {
        const index = this.filteringOperands.findIndex((expr) => {
            if (expr instanceof FilteringExpressionsTree) {
                return this.isFilteringExpressionsTreeForColumn(expr, fieldName)
            }
    
            return (expr as IFilteringExpression).fieldName === fieldName;
        });

        return index;
    }

    protected isFilteringExpressionsTreeForColumn(expressionsTree: IFilteringExpressionsTree, fieldName: string): boolean {
        for (let i = 0; i < expressionsTree.filteringOperands.length; i++) {
            let expr = expressionsTree.filteringOperands[i];
            if ((expr instanceof FilteringExpressionsTree)) {
                return this.isFilteringExpressionsTreeForColumn(expr, fieldName);
            } else {
                return (expr as IFilteringExpression).fieldName === fieldName;
            }
        }

        return false;
    }
}