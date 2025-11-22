import React from "react";
import "./Table.scss";

const Table = ({ headers = [], rows = [], actions = null }) => {
  return (
    <div className="toolbar__table">
      <table className="table">
        <thead className="table__head">
          <tr className="table__row">
            {headers.map((header, index) => (
              <th
                key={index}
                className={`table__header ${
                  header.hideOnMobile ? "table__header--hide-mobile" : ""
                }
                  ${header.isActions ? "table__header--actions" : ""}`}
              >
                {header.label}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="table__body">
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="table__row">
              {row.cells.map((cell, cellIndex) => (
                <td
                  key={cellIndex}
                  className={`table__cell ${cell.className || ""}`}
                >
                  {cell.value}
                </td>
              ))}
              {actions && (
                <td className="table__cell table__cell--actions">
                  {actions(row, rowIndex)}
                </td>
              )}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
