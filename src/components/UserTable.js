import * as React from "react";
import {useTable} from "react-table";

const UserTable = ({data}) => {
    const columns = React.useMemo(() => [
        {
                    Header: "Username",
                    id: "username",
                    accessor: "username"
        }
    ], []);
    const {
        getTableProps,
        getTableBodyProps,
        headerGroups,
        rows,
        prepareRow,
    } = useTable({columns, data})


    return (
            <table {...getTableProps()} class="border-2 border-black-400 my-5">
                <thead>
                {headerGroups.map(h => (
                    <tr {...h.getHeaderGroupProps()}>
                        {h.headers.map(column => (
                            <th {...column.getHeaderProps()}  class="px-4">{column.render('Header')}</th>
                        ))}
                    </tr>
                ))}
                </thead>
                <tbody {...getTableBodyProps()}>
                    {rows.map((row, i) => {
                       prepareRow(row)
                       return (
                           <tr {...row.getRowProps()} class="border px-4">
                               {row.cells.map(cell => {
                                   return <td {...cell.getCellProps()} class="text-center">{cell.render('Cell')}</td>
                               })}
                           </tr>
                       )
                    })}
                </tbody>
            </table>
    );
}

export default UserTable;